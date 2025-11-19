import { Fragment, type ReactElement } from "react";

type ScreenProps = {
  title: string;
  subtitle: string;
};

function PlaceholderScreen({ title, subtitle }: ScreenProps): ReactElement {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8 text-center">
      <div className="space-y-2">
        <p className="text-lg font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export function Lobby() {
  return <PlaceholderScreen title="Word Rally Lobby" subtitle="Pick a prompt pack to begin the rally." />;
}

export function Index() {
  return <PlaceholderScreen title="Word Rally" subtitle="This fast-paced word game is under construction." />;
}

export function Room() {
  return <PlaceholderScreen title="Word Rally Room" subtitle="Game rooms will appear here once ready." />;
}

export function NotFound() {
  return (
    <Fragment>
      <PlaceholderScreen title="Missing Track" subtitle="We couldn&apos;t find that Word Rally route." />
    </Fragment>
  );
}
