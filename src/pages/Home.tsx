import React from 'react';
import GameCard from '../components/GameCard';
import Icon from '../components/icons';

const games = [
  {
    id: 'sudoku',
    title: 'Sudoku',
    description:
      'Fill the grid so every row, column, and box contains unique numbers. Choose from 6×6 or 9×9 puzzles!',
    icon: <Icon name="sudoku" />,
    to: '/sudoku',
    color: '#8b5cf6',
  },
  {
    id: 'minesweeper',
    title: 'Minesweeper',
    description: 'Uncover cells without hitting mines. Use number clues to navigate safely.',
    icon: <Icon name="minesweeper" />,
    to: '/minesweeper',
    color: '#f43f5e',
  },
  {
    id: '2048',
    title: '2048',
    description: 'Slide and combine tiles to reach 2048. How high can you score?',
    icon: <Icon name="game2048" />,
    to: '/2048',
    color: '#f59e0b',
  },
  {
    id: 'wordle',
    title: 'Wordle',
    description: 'Guess the 5-letter word in 6 tries. Colors reveal your progress.',
    icon: <Icon name="wordle" />,
    to: '/wordle',
    color: '#22c55e',
  },
];

export default function Home() {
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-brand">
          <span className="brand-icon">
            <Icon name="brand" size={44} />
          </span>
          <h1>Gaming Hub</h1>
        </div>
        <p className="home-tagline">Classic puzzle games, beautifully crafted</p>
      </header>

      <section className="games-grid">
        {games.map((game) => (
          <GameCard key={game.id} {...game} />
        ))}
      </section>

      <footer className="home-footer">
        <p>Built with React + TypeScript • Made with care</p>
      </footer>
    </div>
  );
}
