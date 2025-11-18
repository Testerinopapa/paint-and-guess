import assert from "node:assert";

import { fallbackGameRegistry } from "@/games/registry/fallback";
import { getRedirects, getNavigationFromRoutes, selectRoutableGames } from "@/router/gameRouteRegistry";

function main() {
  const routableGames = selectRoutableGames(fallbackGameRegistry.entries);

  assert.strictEqual(routableGames.length > 0, true, "Expected at least one routable game");

  const paintGame = routableGames.find((game) => game.entry.id === "paint-and-guess");
  assert.ok(paintGame, "paint-and-guess should be routable via fallback registry");
  assert.strictEqual(paintGame?.routes.length, 3, "paint-and-guess should expose three routes");
  assert.ok(
    paintGame?.routes.some((route) => route.index),
    "paint-and-guess should expose an index route for its lobby",
  );

  const navigation = getNavigationFromRoutes(routableGames);
  assert.ok(navigation.some((nav) => nav.to === paintGame?.basePath), "navigation should include base path");

  const redirects = getRedirects(routableGames) ?? [];
  assert.ok(redirects.some((redirect) => redirect.from === "/single"), "legacy single redirect should exist");
  assert.ok(redirects.some((redirect) => redirect.from === "/room/:roomId"), "room redirect should exist");

  console.log("\n✅ Route registry test passed");
  console.log(JSON.stringify({
    routableCount: routableGames.length,
    navigation,
    redirectCount: redirects.length,
    paintBasePath: paintGame?.basePath,
  }, null, 2));
}

main();
