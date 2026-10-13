import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createMatch } from '../domain/reducer';
import { TeamPanel } from './TeamPanel';

const noop = () => undefined;

describe('serve marker', () => {
  it('shows the server number beside the ball and not in the middle', () => {
    const state = {
      ...createMatch(1_700_000_000_000, '00000000-0000-4000-8000-000000000001'),
      serve: { team: 'b' as const, player: 2 as const },
    };
    const html = renderToStaticMarkup(
      <>
        <TeamPanel team="a" state={state} onIncrement={noop} onDecrement={noop} onRename={noop} onSelectSet={noop} onServe={noop} />
        <TeamPanel team="b" state={state} onIncrement={noop} onDecrement={noop} onRename={noop} onSelectSet={noop} onServe={noop} />
      </>,
    );
    expect(html).toContain('data-testid="serve-player-b"');
    expect(html).toContain('>2<');
    expect(html).not.toContain('data-testid="serve-player-a"');
  });
});
