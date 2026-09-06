import { useState } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { HUD, NavTabs, type Tab } from './components/HUD';
import { EventScreen } from './components/EventScreen';
import {
  RelationshipsTab,
  FamilyTab,
  CareerTab,
  MemoriesTab,
  StatisticsTab,
} from './components/Tabs';
import { CharacterCreation } from './components/CharacterCreation';
import {
  MenuScreen,
  WowMomentOverlay,
  LifeSummaryScreen,
} from './components/Overlays';

export default function App() {
  const {
    state,
    startGame,
    makeChoice,
    continueAfterWow,
    returnToMenu,
    goToCreation,
    explainOutcome,
  } = useGameEngine();

  const [activeTab, setActiveTab] = useState<Tab>('event');

  // 1. Menu phase
  if (state.phase === 'menu') {
    return <MenuScreen onStartNew={goToCreation} />;
  }

  // 2. Character creation phase
  if (state.phase === 'character_creation') {
    return (
      <CharacterCreation
        onStart={(name, gender, location) => {
          startGame(name, gender, location);
          setActiveTab('event');
        }}
        onBack={returnToMenu}
      />
    );
  }

  // 3. Life summary / Game over phase
  if (state.phase === 'life_summary') {
    return (
      <LifeSummaryScreen
        character={state.character}
        onRestart={goToCreation}
        explainOutcome={explainOutcome}
      />
    );
  }

  // 4. Playing or Wow moment phase
  return (
    <div className="game-shell">
      {/* Top HUD */}
      <HUD char={state.character} />

      {/* Navigation tabs */}
      <NavTabs
        active={activeTab}
        onChange={tab => setActiveTab(tab)}
      />

      {/* Main tab content */}
      <main className="game-main" id="main-content">
        {activeTab === 'event' && (
          <div className="tab-panel">
            {state.activeEvent ? (
              <EventScreen
                event={state.activeEvent}
                character={state.character}
                onChoice={choiceId => {
                  makeChoice(choiceId);
                }}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🌟</div>
                <p className="empty-state-text">
                  Không còn sự kiện nào trong giai đoạn này.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'relationships' && (
          <RelationshipsTab character={state.character} />
        )}

        {activeTab === 'family' && (
          <FamilyTab character={state.character} />
        )}

        {activeTab === 'career' && (
          <CareerTab character={state.character} />
        )}

        {activeTab === 'memories' && (
          <MemoriesTab character={state.character} explainOutcome={explainOutcome} />
        )}

        {activeTab === 'statistics' && (
          <StatisticsTab character={state.character} />
        )}
      </main>

      {/* Wow moment modal overlay */}
      {state.phase === 'wow_moment' && state.pendingWowEvent && (
        <WowMomentOverlay
          event={state.pendingWowEvent}
          onContinue={continueAfterWow}
        />
      )}
    </div>
  );
}
