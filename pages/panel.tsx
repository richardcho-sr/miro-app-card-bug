import { useEffect, useState } from 'react';
import { Item, SelectionUpdateEvent, StickyNote } from '@mirohq/websdk-types';
import { GetServerSideProps } from 'next';
import initMiro from '../initMiro';

function reduceToStickyNotes(items: Item[]): StickyNote[] {
  return items.reduce<StickyNote[]>((list, item) => {
    if (item.type === 'sticky_note') {
      list.push(item);
    }
    return list;
  }, []);
}

export const getServerSideProps: GetServerSideProps =
  async function getServerSideProps({ req }) {
    const { miro } = initMiro(req);

    // redirect to auth url if user has not authorized the app
    if (!(await miro.isAuthorized(''))) {
      return {
        props: {
          boards: [],
          authUrl: miro.getAuthUrl(),
        },
      };
    }

    return {
      props: {},
    };
  };

export default function Panel({ authUrl }: { authUrl?: string }) {
  const [selectedItems, setSelectedItems] = useState<StickyNote[]>([]);

  useEffect(() => {
    const eventHandler = async (event: SelectionUpdateEvent) => {
      const stickyNoteItems = reduceToStickyNotes(event.items);
      setSelectedItems(stickyNoteItems);
    };

    (async () => {
      // This runs when the user has already selected some sticky notes and then opens the app
      const items = await miro.board.getSelection();
      setSelectedItems(reduceToStickyNotes(items));

      // This continues to run once the app has been opened and allows us to listen for new selection events
      miro.board.ui.on('selection:update', eventHandler);
    })();

    // clean up function
    return () => {
      miro.board.ui.off('selection:update', eventHandler);
    };
  }, []);

  async function convertToAppCards() {
    await Promise.all(
      selectedItems.map(async (item) => {
        await miro.board.createAppCard({
          title: item.content,
          status: 'connected',
          x: item.x,
          y: item.y,
        });
        await miro.board.remove(item);
      })
    );
  }

  if (authUrl) {
    return (
      <div className="grid wrapper">
        <div className="cs1 ce12">
          <a className="button button-primary" href={authUrl}>
            Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <p>{selectedItems.length} notes selected</p>
      <button onClick={convertToAppCards}>Convert to app card</button>
    </>
  );
}
