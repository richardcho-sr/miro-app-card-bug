import { useEffect } from 'react';

export default function Main() {
  useEffect(() => {
    window.miro.board.ui.on('icon:click', async () => {
      window.miro.board.ui.openPanel({
        url: `/panel`,
      });
    });

    window.miro.board.ui.on('app_card:open', async () => {
      window.miro.board.ui.openModal({
        url: `/modal`,
      });
    });
  }, []);

  return null;
}
