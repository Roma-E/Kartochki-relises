// Версия подставляется автоматически при сборке релиза (тег vX.Y.Z)
const APP_VERSION = '0.2.6';
// Откуда приложение узнаёт о новых версиях (открытый репозиторий только с APK)
const UPDATE_URL = 'https://raw.githubusercontent.com/Roma-E/Kartochki-relises/main/latest.json';
const BETA_URL = 'https://raw.githubusercontent.com/Roma-E/Kartochki-relises/main/beta.json';
const DOWNLOAD_PAGE = 'https://github.com/Roma-E/Kartochki-relises#readme';
// Откат прогресса после бага: null — ничего не делать. Пример: { ver: '0.2.6', keys: ['pet', 'tokens'] }
// вернёт питомцев и жетоны к снимку, сделанному до версии 0.2.6 (см. versionSnapshot в main.js).
const ROLLBACK = null;
