export async function initYandex() {
  if (!(window as any).YaGames) {
    console.log("YaGames SDK not found (local mode).");
    return null;
  }
  try {
    const ysdk = await (window as any).YaGames.init();
    (window as any).ysdk = ysdk;
    ysdk.features.LoadingAPI?.ready(); // Tell Yandex the game has been fully loaded
    console.log("Yandex Games SDK initialized");
    return ysdk;
  } catch (e) {
    console.error('Yandex SDK Init Error:', e);
    return null;
  }
}
