import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TetrisPage from '../../pages/TetrisPage';
import MinesweeperPage from '../../pages/MinesweeperPage';
import GameLayout from '../GameLayout';
import Icon from '../icons';

/**
 * Usability & accessibility tests for the changes made in the mobile/desktop
 * usability review. These focus on: (1) mobile users receiving control
 * guidance, (2) removal of a misleading hint, and (3) icon accessibility.
 */

describe('Tetris — mobile control guidance (usability #3)', () => {
  it('shows a mobile-only controls hint so touch users know the gestures', () => {
    render(
      <MemoryRouter>
        <GameLayout title="Tetris" color="#8b5cf6" icon={<Icon name="tetris" />}>
          <TetrisPage />
        </GameLayout>
      </MemoryRouter>
    );

    // The mobile hint text added in the review must be present.
    const mobileHint = screen.getByText(/Move •.*Soft Drop •.*Rotate •.*Hard Drop/i);
    expect(mobileHint).toBeInTheDocument();
    // It must be scoped to mobile-only so it does not duplicate the desktop legend.
    expect(mobileHint.className).toContain('mobile-only');
  });

  it('still shows the desktop legend on larger viewports', () => {
    render(
      <MemoryRouter>
        <GameLayout title="Tetris" color="#8b5cf6" icon={<Icon name="tetris" />}>
          <TetrisPage />
        </GameLayout>
      </MemoryRouter>
    );
    expect(screen.getByText(/Soft Drop •.*Hard Drop •.*Rotate CW/i)).toBeInTheDocument();
  });
});

describe('Minesweeper — accurate hint (usability #1)', () => {
  it('no longer promises a non-existent "drag to pan" feature', () => {
    render(
      <MemoryRouter>
        <GameLayout title="Minesweeper" color="#f43f5e" icon={<Icon name="minesweeper" />}>
          <MinesweeperPage />
        </GameLayout>
      </MemoryRouter>
    );
    expect(screen.queryByText(/drag to pan/i)).not.toBeInTheDocument();
  });

  it('shows accurate mobile guidance instead', () => {
    const { container } = render(
      <MemoryRouter>
        <GameLayout title="Minesweeper" color="#f43f5e" icon={<Icon name="minesweeper" />}>
          <MinesweeperPage />
        </GameLayout>
      </MemoryRouter>
    );
    const hint = container.querySelector('.minesweeper-hint');
    expect(hint).not.toBeNull();
    expect(within(hint as HTMLElement).getByText(/Long-press to flag/i)).toBeInTheDocument();
  });
});

describe('Icon accessibility', () => {
  it('game title icons should not expose an unlabeled SVG to screen readers', () => {
    // Icons are used in GameLayout titles and game cards. As decorative or
    // named graphics they must not be an empty, unlabeled image.
    const { container } = render(<Icon name="sudoku" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // Either explicitly decorative or carrying a label.
    const ariaHidden = svg?.getAttribute('aria-hidden');
    const role = svg?.getAttribute('role');
    const title = svg?.getAttribute('aria-label') ?? svg?.querySelector('title');
    const acceptable = ariaHidden === 'true' || role === 'img' || title != null;
    expect(acceptable).toBe(true);
  });
});
