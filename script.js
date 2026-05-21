import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getDatabase,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
  query,
  orderByChild,
  limitToLast,
  onChildAdded,
  get,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBbeOiGbIhPG0UVUphpxeKKrFOzA9eKglw',
  authDomain: 'aczino-577da.firebaseapp.com',
  databaseURL: 'https://aczino-577da-default-rtdb.firebaseio.com',
  projectId: 'aczino-577da',
  storageBucket: 'aczino-577da.firebasestorage.app',
  messagingSenderId: '831497584426',
  appId: '1:831497584426:web:bc57aa1e3ab7cdef206853',
  measurementId: 'G-5ZF6ZCK7BC',
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const charactersRef = ref(database, 'characters');
const presenceRef = ref(database, 'presence');
const REQUIRED_BOTS = 10;
const BOT_NAMES = [
  'BOB',
  'HERMANO DE BOB',
  'BOB RUBIO',
  'BOB MUJER',
  'BOB TRANS LESBIANO',
  'NOVIA IMAGINARIA DE BOB',
  'MAMÁ DE BOB',
  'DENTISTA DE BOB',
  'ABUELA DE BOB',
  'PAPÁ DE BOB',
];


const BOT_PROFILE_EMOJI = '👤';

function getBotAvatarDataUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="100%" height="100%" fill="#080808"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="76">${BOT_PROFILE_EMOJI}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getParticipantProfileImage(participant, character) {
  if (participant?.fake) return getBotAvatarDataUrl();
  return character?.image || 'https://via.placeholder.com/64x64?text=?';
}

const BOT_DESCRIPTIONS = {
  BOB: 'Se llama Bob, y bueno su apodo es Bob',
  'HERMANO DE BOB': 'Es el hermano de Bob. Se parece mucho a Bob',
  'BOB RUBIO': 'Es Bob pero se tiñó el pelo de Rubio.',
  'BOB MUJER': 'Es Bob pero se puso un corpiño',
  'BOB TRANS LESBIANO': 'Es Bob pero se autopercibe mujer aunque le siguen gustando las mujeres',
  'NOVIA IMAGINARIA DE BOB': 'Bob se imaginó una novia pero aún no sabe cómo nombrarla',
  'MAMÁ DE BOB': 'Ella siempre tuvo sospechas de que su esposo la engañó y que realmente Bob no era su hijo. Pero aun así se hizo cargo.',
  'DENTISTA DE BOB': 'No tiene el título de dentista, pero una vez le sacó un diente a Bob atando su diente flojo a una puerta y cerrándola con fuerza',
  'ABUELA DE BOB': 'Es la mamá de la mamá de Bob.',
  'PAPÁ DE BOB': 'Le fue infiel a su esposa y tuvo un hijo con otra, pero le hizo creer a su esposa que Bob era su hijo. Hasta el día de hoy lo sigue creyendo.',
};

const menuButtons = document.querySelectorAll('.menu-btn');
const views = {
  gallery: document.getElementById('gallery-view'),
  suspects: document.getElementById('suspects-view'),
  'crime-scene': document.getElementById('crime-scene-view'),
};

const addCharacterBtn = document.getElementById('add-character-btn');
const form = document.getElementById('character-form');
const cancelBtn = document.getElementById('cancel-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalOverlay = document.getElementById('modal-overlay');
const saveCharacterBtn = document.getElementById('save-character-btn');
const galleryGrid = document.getElementById('gallery-grid');
const emptyMsg = document.getElementById('empty-msg');
const imageSource = document.getElementById('imageSource');
const imageFileField = document.getElementById('imageFileField');
const imageUrlField = document.getElementById('imageUrlField');
const characterDetailOverlay = document.getElementById('character-detail-overlay');
const characterDetailContent = document.getElementById('character-detail-content');
const closeCharacterDetailBtn = document.getElementById('close-character-detail-btn');
const googleLoginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const authStatus = document.getElementById('auth-status');

const onlineUsersList = document.getElementById('online-users-list');
const groupCount = document.getElementById('group-count');
const groupMembers = document.getElementById('group-members');
const openPlayBtn = document.getElementById('open-play-btn');
const openCharacterBtn = document.getElementById('open-character-btn');
const characterSelectOverlay = document.getElementById('character-select-overlay');
const closeCharacterSelectBtn = document.getElementById('close-character-select-btn');
const characterOptions = document.getElementById('character-options');
const characterPreview = document.getElementById('character-preview');
const confirmCharacterBtn = document.getElementById('confirm-character-btn');
const gameOverlay = document.getElementById('game-overlay');
const closeGameBtn = document.getElementById('close-game-btn');
const endGameBtn = document.getElementById('end-game-btn');
const openCrimeSceneBtn = document.getElementById('open-crime-scene-btn');
const crimeSceneNewGameBtn = document.getElementById('crime-scene-new-game-btn');

const crimeTabCluesBtn = document.getElementById('crime-tab-clues');
const crimeTabCharactersBtn = document.getElementById('crime-tab-characters');
const crimeTabPhasesBtn = document.getElementById('crime-tab-phases');
const gameChatMessages = document.getElementById('game-chat-messages');
const gameChatForm = document.getElementById('game-chat-form');
const gameChatInput = document.getElementById('game-chat-input');
const activeChatSectionLabel = document.getElementById('active-chat-section');
const crimeRoomGrid = document.getElementById('crime-room-grid');
const crimeRoomCells = document.querySelectorAll('.crime-room-cell');
const playerProfile = document.getElementById('player-profile');
const scenePlayersList = document.getElementById('scene-players-list');
const sceneCharacterDetail = document.getElementById('scene-character-detail');
const killPlayerBtn = document.getElementById('kill-player-btn');
const accusePlayerBtn = document.getElementById('accuse-player-btn');
const galleryContextMenu = document.getElementById('gallery-context-menu');
const contextEditBtn = document.getElementById('context-edit-btn');
const contextDeleteBtn = document.getElementById('context-delete-btn');
const crimeContextMenu = document.getElementById('crime-context-menu');
const crimeActionBtn = document.getElementById('crime-action-btn');
const crimeCancelBtn = document.getElementById('crime-cancel-btn');
const crimeCharactersPanel = document.getElementById('crime-characters-panel');
const crimeCharactersDetailPanel = document.getElementById('crime-characters-detail-panel');
const crimePhasesPanel = document.getElementById('crime-phases-panel');
const crimeCluesPanel = document.getElementById('crime-clues-panel');
const phasesList = document.getElementById('phases-list');
const phaseProgress = document.getElementById('phase-progress');
const nextPhaseBtn = document.getElementById('next-phase-btn');
const phaseAccuseBtn = document.getElementById('phase-accuse-btn');
const phaseAccuseList = document.getElementById('phase-accuse-list');
const cluesList = document.getElementById('clues-list');
const dawnOverlay = document.getElementById('dawn-overlay');
const dawnMessage = document.getElementById('dawn-message');
const closeDawnBtn = document.getElementById('close-dawn-btn');
const dawnNextPhaseBtn = document.getElementById('dawn-next-phase-btn');

const CRIME_SECTIONS = Array.from(crimeRoomCells).map((cell) => cell.dataset.section).filter(Boolean);
const LIVING_ROOM_SECTION = 'centro-arriba';
const DEFAULT_SECTION = CRIME_SECTIONS.includes(LIVING_ROOM_SECTION) ? LIVING_ROOM_SECTION : (CRIME_SECTIONS[0] || 'noroeste');
const BOT_MOVE_INTERVAL_MS = 60000;
const DAY_PHASES = [
  'Noche',
  'Amanecer',
  'Debate en salas',
  'Votación final',
];

const PHASE_DESCRIPTIONS = {
  1: 'Fase 1: el asesino decide a quién asesinar durante la noche.',
  2: 'Fase 2: se investigan pistas y movimientos.',
  3: 'Fase 3: debate libre en chats de sala (máx. 10 mensajes visibles por sala). Solo puedes leer el chat de la sala en la que estés.',
  4: 'Fase 4: el detective decide a quién culpar como asesino.',
};

const state = {
  characters: [],
  user: null,
  onlineUsers: [],
  currentGroup: null,
  presenceCleanup: null,
  selectedCharacterId: null,
  gameRole: null,
  gameChatJoinAt: null,
  gameChatUnsubscribe: null,
  currentCrimeSection: null,
  gameMessages: [],
  gameState: null,
  selectedCrimeParticipantUid: null,
  editingCharacterId: null,
  contextCharacterId: null,
  contextCrimeTargetUid: null,
  persistedGroupParticipants: [],
  groupUnsubscribe: null,
  deathAlertShown: false,
  dawnAlertShownForPhase: null,
  lastExecutionAlertKey: null,
  botMovementInterval: null,
};

function getRealGroupMembers() {
  return (state.currentGroup?.participants || []).filter((member) => !member.fake);
}

function dedupeParticipants(participants = []) {
  const map = new Map();
  participants.forEach((member) => {
    if (!member?.uid) return;
    map.set(member.uid, member);
  });
  return Array.from(map.values());
}

function getTakenCharacterIds() {
  return (state.currentGroup?.participants || [])
    .map((member) => member.characterId)
    .filter(Boolean);
}


function isBotCharacter(character) {
  return BOT_NAMES.includes(character?.nombre);
}

function getRandomCrimeSection() {
  const index = Math.floor(Math.random() * CRIME_SECTIONS.length);
  return CRIME_SECTIONS[index] || DEFAULT_SECTION;
}

function getParticipantSection(participant) {
  if (!participant) return null;
  return participant.section || DEFAULT_SECTION;
}

function getParticipantsInCurrentSection(participants = []) {
  const aliveParticipants = participants.filter((participant) => !isParticipantDead(participant?.uid));
  if (!state.currentCrimeSection) return aliveParticipants;
  return aliveParticipants.filter((participant) => getParticipantSection(participant) === state.currentCrimeSection);
}

async function maybeStartBotMovement() {
  if (state.botMovementInterval || !state.currentGroup?.id || !state.gameState || state.gameState.status !== 'active') return;

  state.botMovementInterval = setInterval(async () => {
    try {
      const groupRef = ref(database, `groups/${state.currentGroup.id}`);
      const snapshot = await get(groupRef);
      const latestGroup = snapshot.val();
      if (!latestGroup?.participants?.length) return;

      const movedParticipants = latestGroup.participants.map((participant) => {
        if (!participant?.fake) return participant;
        return {
          ...participant,
          section: getRandomCrimeSection(),
        };
      });

      await set(groupRef, {
        ...latestGroup,
        participants: movedParticipants,
      });
    } catch (error) {
      console.error('No se pudo mover bots de sección:', error);
    }
  }, BOT_MOVE_INTERVAL_MS);
}

function stopBotMovement() {
  if (!state.botMovementInterval) return;
  clearInterval(state.botMovementInterval);
  state.botMovementInterval = null;
}

function getSelectableCharactersForParticipant(participant) {
  if (participant?.fake) {
    return state.characters.filter((character) => isBotCharacter(character));
  }
  return state.characters.filter((character) => !isBotCharacter(character));
}


function areAllRealPlayersReady(group = state.currentGroup) {
  const realMembers = (group?.participants || []).filter((member) => !member.fake);
  return realMembers.length > 0 && realMembers.every((member) => Boolean(member.characterId));
}

function canStartNewGame() {
  return !state.gameState || state.gameState.status !== 'active';
}

function getRealPlayerUids(group = state.currentGroup) {
  return (group?.participants || []).filter((member) => !member.fake).map((member) => member.uid);
}

function updatePlayButtons() {
  const canStart = Boolean(state.user && state.currentGroup?.id && canStartNewGame());
  openPlayBtn.disabled = !canStart;
  openPlayBtn.textContent = canStart ? 'JUGAR' : 'PARTIDA EN CURSO';
  openCharacterBtn.disabled = !(state.user && state.currentGroup?.id);

  const canOpenScene = Boolean(state.user && state.currentGroup?.id);
  openCrimeSceneBtn.disabled = !canOpenScene;
  endGameBtn.disabled = !(canOpenScene && state.gameState?.status === 'active');
  renderCrimeScenePlayers();
}

function openCharacterSelectModal({ allowDuringActiveGame = false } = {}) {
  if (!state.user) {
    alert('Debes iniciar sesión para jugar.');
    return;
  }

  if (!allowDuringActiveGame && !canStartNewGame()) {
    alert('La partida ya está en curso. Entra desde ESCENA DEL CRIMEN.');
    return;
  }

  if (!state.characters.length) {
    alert('No hay personajes disponibles todavía.');
    return;
  }

  const myParticipant = (state.currentGroup?.participants || []).find((p) => p.uid === state.user.uid);
  if (myParticipant?.characterId) {
    alert('Ya elegiste personaje para esta partida.');
    return;
  }

  state.selectedCharacterId = null;
  renderCharacterOptions();
  renderCharacterPreview(null);
  confirmCharacterBtn.disabled = true;
  characterSelectOverlay.classList.remove('hidden');
}

function closeCharacterSelectModal() {
  characterSelectOverlay.classList.add('hidden');
}

function openGameModal() {
  gameOverlay.classList.remove('hidden');
  updateGameChatAvailability();
  gameOverlay.requestFullscreen?.().catch(() => {});
}

function closeGameModal() {
  if (document.fullscreenElement === gameOverlay) {
    document.exitFullscreen?.().catch(() => {});
  }

  if (state.gameChatUnsubscribe) {
    state.gameChatUnsubscribe();
    state.gameChatUnsubscribe = null;
  }

  state.gameMessages = [];
  gameChatMessages.innerHTML = '';
  gameOverlay.classList.add('hidden');
}


function getMyCharacter() {
  const myParticipant = (state.currentGroup?.participants || []).find((p) => p.uid === state.user?.uid);
  if (!myParticipant?.characterId) return null;
  return state.characters.find((character) => character.id === myParticipant.characterId) || null;
}

async function ensureGameRole() {
  if (!state.currentGroup?.id || !state.user) return;
  const gameStateRef = ref(database, `games/${state.currentGroup.id}`);
  const snapshot = await get(gameStateRef);
  let gameState = snapshot.val();
  const participants = state.currentGroup?.participants || [];
  const realMembers = participants.filter((member) => !member.fake);

  const detectiveIsRealUser = realMembers.some((member) => member.uid === gameState?.detectiveUid);
  if (!gameState?.killerUid || !gameState?.detectiveUid || !detectiveIsRealUser) {
    if (!realMembers.length) return;

    const detectiveUid = realMembers[Math.floor(Math.random() * realMembers.length)].uid;
    const killerPool = participants.filter((member) => member.uid !== detectiveUid);
    const randomIndex = Math.floor(Math.random() * killerPool.length);
    const killerUid = killerPool[randomIndex]?.uid || participants[0]?.uid || state.user.uid;

    gameState = {
      killerUid,
      detectiveUid,
      createdAt: Date.now(),
      status: 'active',
      currentPhase: 1,
      phaseVotes: {},
    };
    await set(gameStateRef, gameState);
  }

  state.gameState = gameState;
  state.gameRole = gameState.killerUid === state.user.uid
    ? 'asesino'
    : (gameState.detectiveUid === state.user.uid ? 'detective' : 'civil');
  updatePlayButtons();
}

function renderPlayerProfile() {
  const participantsInSection = getParticipantsInCurrentSection(
    normalizeGroupMembers(state.currentGroup?.participants || []),
  );
  const myCharacter = getMyCharacter();

  const miniCards = participantsInSection.map((participant) => {
    const participantCharacter = state.characters.find((item) => item.id === participant.characterId);
    const participantImage = getParticipantProfileImage(participant, participantCharacter);
    const participantName = participantCharacter?.nombre || participant.name || 'Jugador';
    const status = isParticipantDead(participant.uid) ? 'Eliminado' : 'Activo';
    return `
      <article class="section-player-mini" title="${participantName}">
        <img src="${participantImage}" alt="${participantName}" class="section-player-mini-image" />
        <p class="meta">${participantName}</p>
        <span class="meta">${status}</span>
      </article>
    `;
  }).join('');

  const sectionLabel = state.currentCrimeSection
    ? state.currentCrimeSection.replace('-', ' ').toUpperCase()
    : 'SIN SECCIÓN';

  const myNameLabel = myCharacter?.nombre || state.user?.displayName || state.user?.email || 'Sin personaje';

  playerProfile.innerHTML = `
    <h4 class="player-role-name">${myNameLabel}</h4>
    <p class="meta"><strong>En tu sección (${sectionLabel}):</strong> ${participantsInSection.length} jugador(es)/bot(s)</p>
    <div class="section-player-mini-grid">${miniCards || '<p class="meta">No hay participantes en esta sección.</p>'}</div>
  `;
}

function renderGameChat() {
  gameChatMessages.innerHTML = state.gameMessages
     .slice(-10)
    .map((msg) => {
      const canMark = state.gameRole === 'detective' && state.gameState?.status === 'active';
      return `<div class="chat-message"><p><strong>${msg.name}:</strong> ${msg.text}</p>${canMark ? `<button type="button" class="secondary mark-clue-btn" data-mark-clue='${JSON.stringify({ uid: msg.uid || '', name: msg.name || 'Jugador', text: msg.text || '' })}'>Marcar como Pista</button>` : ''}</div>`;
    })
    .join('');
  gameChatMessages.scrollTop = gameChatMessages.scrollHeight;
}

function renderClues() {
  if (!cluesList) return;
  if (!state.clues.length) {
    cluesList.innerHTML = '<p class="meta">Todavía no hay pistas marcadas.</p>';
    return;
  }
  cluesList.innerHTML = state.clues
    .slice()
    .reverse()
    .map((clue) => `<article class="clue-card"><p><strong>${clue.name || 'Jugador'}:</strong> ${clue.text || ''}</p></article>`)
    .join('');
}

function renderCrimeSectionSelection() {
  crimeRoomCells.forEach((cell) => {
    cell.classList.toggle('selected', cell.dataset.section === state.currentCrimeSection);
  });
  activeChatSectionLabel.textContent = state.currentCrimeSection
    ? `Sección activa: ${state.currentCrimeSection}`
    : 'Sin sección seleccionada';
}

function subscribeGameChat() {
  if (!state.currentGroup?.id || !state.currentCrimeSection) return;
  if (state.gameChatUnsubscribe) state.gameChatUnsubscribe();

  state.gameMessages = [];
  renderGameChat();

  const chatRef = query(
    ref(database, `gameChats/${state.currentGroup.id}/${state.currentCrimeSection}`),
    orderByChild('createdAt'),
    limitToLast(10),
  );
  state.gameChatUnsubscribe = onChildAdded(chatRef, (snapshot) => {
    const message = snapshot.val();
    if (!message) return;

    state.gameMessages.push(message);
    state.gameMessages = state.gameMessages.slice(-10);
    renderGameChat();
  });
}


function getKilledUids() {
  return state.gameState?.killedUids || {};
}

function isParticipantDead(uid) {
  if (!uid) return false;
  return Boolean(getKilledUids()[uid]);
}

function getAliveRealParticipants(game = state.gameState, group = state.currentGroup) {
  const killed = game?.killedUids || {};
  return (group?.participants || [])
    .filter((member) => !member.fake)
    .filter((member) => !killed[member.uid]);
}

async function cleanupFinishedGame(groupId) {
  if (!groupId) return;
  const groupRef = ref(database, `groups/${groupId}`);
  const groupSnapshot = await get(groupRef);
  const latestGroup = groupSnapshot.val();
  if (latestGroup) {
    const clearedParticipants = (latestGroup.participants || []).map((member) => ({ ...member, characterId: null }));
    await set(groupRef, {
      ...latestGroup,
      participants: clearedParticipants,
    });
  }

  await Promise.all([
    remove(ref(database, `games/${groupId}`)),
    remove(ref(database, `selectedCharacters/${groupId}`)),
    remove(ref(database, `gameChats/${groupId}`)),
  ]);
}

async function resolveGameAfterKill(latestGame) {
  if (!state.currentGroup?.id) return;
  const aliveParticipants = getAliveRealParticipants(latestGame, state.currentGroup);
  const killerAlive = aliveParticipants.some((member) => member.uid === latestGame.killerUid);
  const detectiveAlive = aliveParticipants.some((member) => member.uid === latestGame.detectiveUid);
  const killerDead = Boolean(latestGame.killedUids?.[latestGame.killerUid]);

  const assassinWin = killerAlive && aliveParticipants.length <= 2;
  const detectiveWin = killerDead && detectiveAlive;

  if (!assassinWin && !detectiveWin) return;

  await cleanupFinishedGame(state.currentGroup.id);
  state.gameState = null;
  updatePlayButtons();
  closeGameModal();
  alert(assassinWin
    ? 'La partida terminó: el asesino eliminó a todos hasta dejar solo a un superviviente.'
    : 'La partida terminó: el detective eliminó al asesino. Ganan todos menos el asesino.');
}

function canCurrentUserSeeKillButton(targetParticipant) {
  if (!targetParticipant || targetParticipant.fake) return false;
  if (state.gameRole !== 'asesino') return false;
  if (state.gameState?.status !== 'active') return false;
  if (targetParticipant.uid === state.user?.uid) return false;
  if (targetParticipant.uid === state.gameState?.detectiveUid) return false;
  if (isParticipantDead(targetParticipant.uid)) return false;
  return true;
}

function canCurrentUserKill(targetParticipant) {
  if (!canCurrentUserSeeKillButton(targetParticipant)) return false;
  if ((state.gameState?.currentPhase || 1) !== 1) return false;
  return true;
}

function canCurrentUserAccuse(targetParticipant) {
  if (!targetParticipant || targetParticipant.fake) return false;
  if (state.gameRole !== 'detective') return false;
  if (state.gameState?.status !== 'active') return false;
  if ((state.gameState?.currentPhase || 1) !== 4) return false;
  if (targetParticipant.uid === state.user?.uid) return false;
  if (isParticipantDead(targetParticipant.uid)) return false;
  return true;
}


function shouldShowCrimeSceneNewGameButton() {
  return state.gameState?.status === 'finished' && state.gameState?.winner === 'detective-civiles';
}

function updateCrimeSceneEndState() {
  const showNewGameButton = shouldShowCrimeSceneNewGameButton();
  crimeSceneNewGameBtn?.classList.toggle('hidden', !showNewGameButton);

  document.querySelector('.crime-scene-layout')?.classList.toggle('hidden', showNewGameButton);
  document.querySelector('#crime-scene-view .crime-scene-header')?.classList.toggle('hidden', showNewGameButton);
  document.querySelector('#crime-scene-view > .meta')?.classList.toggle('hidden', showNewGameButton);
}

function updateGameChatAvailability() {
  const dead = isParticipantDead(state.user?.uid);
  const missingSection = !state.currentCrimeSection;
  gameChatInput.disabled = dead || missingSection;
  gameChatForm.querySelector('button[type="submit"]').disabled = dead || missingSection;
  gameChatInput.placeholder = dead
    ? 'Has sido asesinado. Solo puedes observar la partida.'
    : missingSection
      ? 'Elige una sección de la sala para chatear.'
      : 'Escribe un mensaje...';
}

async function killParticipant(targetUid) {
  if (!state.currentGroup?.id || !targetUid) return;
  if (state.gameRole !== 'asesino') return;
  if ((state.gameState?.currentPhase || 1) !== 1 || state.gameState?.status !== 'active') {
    alert('Solo puedes asesinar durante la fase Noche.');
    return;
  }

  const gameRef = ref(database, `games/${state.currentGroup.id}`);
  const snapshot = await get(gameRef);
  const latestGame = snapshot.val() || state.gameState || {};
  const killedUids = latestGame.killedUids || {};
  if (targetUid === latestGame.detectiveUid) {
    alert('No puedes asesinar al detective.');
    return;
  }

  if (killedUids[targetUid]) return;

  const updatedGame = {
    ...latestGame,
    status: latestGame.status || 'active',
    killedUids: {
      ...killedUids,
      [targetUid]: Date.now(),
    },
  };
  await set(gameRef, updatedGame);
  await resolveGameAfterKill(updatedGame);
}

async function accuseParticipant(targetUid) {
  if (!state.currentGroup?.id || !targetUid || state.gameRole !== 'detective') return;
  const gameRef = ref(database, `games/${state.currentGroup.id}`);
  const snapshot = await get(gameRef);
  const latestGame = snapshot.val() || state.gameState || {};
  if ((latestGame.currentPhase || 1) !== 4 || latestGame.status !== 'active') return;

  const methods = ['HORCA', 'SILLA ELECTRICA', 'FUSILAMIENTO'];
  const method = methods[Math.floor(Math.random() * methods.length)];
  const accusedWasKiller = latestGame.killerUid === targetUid;
  const killedUids = latestGame.killedUids || {};

  const updatedGame = {
    ...latestGame,
    lastExecution: { uid: targetUid, method, wasKiller: accusedWasKiller, at: Date.now() },
  };

  if (accusedWasKiller) {
    updatedGame.status = 'finished';
    updatedGame.winner = 'detective-civiles';
  } else {
    updatedGame.killedUids = { ...killedUids, [targetUid]: Date.now() };
    updatedGame.currentPhase = 1;
    updatedGame.phaseVotes = {};
    updatedGame.phaseUpdatedAt = Date.now();
  }

  await set(gameRef, updatedGame);
}
function renderCharacterOptions() {
  characterOptions.innerHTML = '';
  const takenIds = new Set(getTakenCharacterIds());
  const myParticipant = (state.currentGroup?.participants || []).find((member) => member.uid === state.user?.uid);
  const availableCharacters = getSelectableCharactersForParticipant(myParticipant);

  availableCharacters.forEach((character) => {
    const isTaken = takenIds.has(character.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `character-option${isTaken ? ' blocked' : ''}`;
    button.disabled = isTaken;
    button.innerHTML = `<strong>${character.nombre}</strong><br><span class="meta">${isTaken ? 'Bloqueado' : 'Disponible'}</span>`;

    if (!isTaken) {
      button.addEventListener('click', () => {
        renderCharacterPreview(character);
      });
    }

    if (state.selectedCharacterId === character.id) {
      button.classList.add('selected');
    }

    characterOptions.appendChild(button);
  });
}

function renderCharacterPreview(character) {
  if (!character) {
    characterPreview.innerHTML = '<p class="meta">Selecciona un personaje para ver su ficha completa.</p>';
    return;
  }

  state.selectedCharacterId = character.id;
  confirmCharacterBtn.disabled = false;
  renderCharacterOptions();
  characterPreview.innerHTML = `
    <h4>${character.nombre}</h4>
    <p class="meta"><strong>Historia:</strong> ${character.historia}</p>
    <p class="meta"><strong>Género:</strong> ${character.genero}</p>
    <p class="meta"><strong>Estatura:</strong> ${character.estatura}</p>
    <p class="meta"><strong>Cabello:</strong> ${character.cabello}</p>
    <p class="meta"><strong>Ojos:</strong> ${character.ojos}</p>
    <p class="meta"><strong>Tez:</strong> ${character.tez}</p>
    <p class="meta"><strong>Rasgos:</strong> ${character.rasgos}</p>
    <p class="meta"><strong>Traumas:</strong> ${character.traumas}</p>
    <p class="meta"><strong>Miedo:</strong> ${character.miedo}</p>
    <p class="meta"><strong>Diálogo:</strong> ${character.dialogo || '—'}</p>
  `;
}

async function saveSelectedCharacterToGroup() {
  if (!state.user || !state.selectedCharacterId || !state.currentGroup?.id) return;

  const myParticipant = (state.currentGroup?.participants || []).find((member) => member.uid === state.user.uid);
  const allowedCharacterIds = new Set(getSelectableCharactersForParticipant(myParticipant).map((character) => character.id));
  if (!allowedCharacterIds.has(state.selectedCharacterId)) {
    throw new Error('CHARACTER_NOT_ALLOWED_FOR_PLAYER');
  }

  const groupRef = ref(database, `groups/${state.currentGroup.id}`);
  const groupSnapshot = await get(groupRef);
  const latestGroup = groupSnapshot.val() || state.currentGroup;
  const latestParticipants = latestGroup.participants || [];
  const selectedIsTaken = latestParticipants.some(
    (member) => member.uid !== state.user.uid && member.characterId === state.selectedCharacterId,
  );

  if (selectedIsTaken) {
    throw new Error('CHARACTER_ALREADY_TAKEN');
  }

  const usedCharacterIds = new Set(latestParticipants.map((member) => member.characterId).filter(Boolean));
  let participants = latestParticipants.map((member) => {
    if (member.uid === state.user.uid) {
      usedCharacterIds.add(state.selectedCharacterId);
      return { ...member, characterId: state.selectedCharacterId };
    }
    return member;
  });

  if (areAllRealPlayersReady({ participants })) {
    participants = participants.map((member) => {
      if (member.fake && !member.characterId) {
        const freeCharacter = state.characters.find((character) => isBotCharacter(character) && !usedCharacterIds.has(character.id));
        if (freeCharacter) {
          usedCharacterIds.add(freeCharacter.id);
          return { ...member, characterId: freeCharacter.id };
        }
      }
      return member;
    });
  }

  const finalParticipants = dedupeParticipants(participants);

  await set(groupRef, {
    ...latestGroup,
    participants: finalParticipants,
  });
  const assignedAt = Date.now();
  const selectedCharactersRef = ref(database, `selectedCharacters/${state.currentGroup.id}`);
  const selectedCharactersPayload = {};

  finalParticipants.forEach((member) => {
    if (!member.characterId) return;
    const assignedCharacter = state.characters.find((item) => item.id === member.characterId);
    selectedCharactersPayload[member.uid] = {
      uid: member.uid,
      name: member.name || '',
      fake: Boolean(member.fake),
      characterId: member.characterId,
      characterName: assignedCharacter?.nombre || '',
      assignedAt,
    };
  });

  await set(selectedCharactersRef, selectedCharactersPayload);

  return finalParticipants;
}

function switchToCrimeSceneView() {
  menuButtons.forEach((b) => b.classList.remove('active'));
  Object.values(views).forEach((view) => view.classList.remove('active'));
  document.querySelector('[data-view="crime-scene"]').classList.add('active');
  views['crime-scene'].classList.add('active');
}

menuButtons.forEach((button) => {
  button.addEventListener('click', () => {
    menuButtons.forEach((b) => b.classList.remove('active'));
    Object.values(views).forEach((view) => view.classList.remove('active'));
    button.classList.add('active');
    views[button.dataset.view].classList.add('active');
  });
});

function openCrimeSceneCharactersTab() {
  menuButtons.forEach((button) => button.classList.remove('active'));
  Object.values(views).forEach((view) => view.classList.remove('active'));
  document.querySelector('[data-view="crime-scene"]')?.classList.add('active');
  views['crime-scene']?.classList.add('active');

  crimeTabCluesBtn?.classList.remove('active');
  crimeTabPhasesBtn?.classList.remove('active');
  crimeTabCharactersBtn?.classList.add('active');
  crimeCharactersPanel?.classList.remove('hidden');
  crimeCharactersDetailPanel?.classList.remove('hidden');
  crimePhasesPanel?.classList.add('hidden');
  crimeCluesPanel?.classList.add('hidden');
}

crimeTabCharactersBtn?.addEventListener('click', openCrimeSceneCharactersTab);

function renderPhasesPanel() {
  if (!phasesList || !phaseProgress || !nextPhaseBtn) return;
  const currentPhase = Math.min(Math.max(state.gameState?.currentPhase || 1, 1), DAY_PHASES.length);
  const phaseVotes = state.gameState?.phaseVotes || {};
  const realPlayerUids = getRealPlayerUids();
  const votesCount = realPlayerUids.filter((uid) => phaseVotes[uid]).length;
  const dead = isParticipantDead(state.user?.uid);
  const alreadyVoted = Boolean(state.user?.uid && phaseVotes[state.user.uid]);

  phasesList.innerHTML = DAY_PHASES.map((name, index) => {
    const phaseNumber = index + 1;
    const isActive = phaseNumber === currentPhase;
    const description = PHASE_DESCRIPTIONS[phaseNumber] || '';
    return `<li class="${isActive ? 'active' : ''}"><strong>Fase ${phaseNumber}: ${name}</strong><br /><span class="meta">${description}</span></li>`;
  }).join('');
  phaseProgress.textContent = `Votos para avanzar: ${votesCount}/${realPlayerUids.length || 0}`;
  nextPhaseBtn.disabled = !state.user || state.gameState?.status !== 'active' || alreadyVoted || dead;
  nextPhaseBtn.textContent = dead ? 'HAS SIDO ASESINADO' : (alreadyVoted ? 'VOTO REGISTRADO' : 'SIGUIENTE FASE');
  if (dawnNextPhaseBtn) {
    dawnNextPhaseBtn.disabled = nextPhaseBtn.disabled;
    dawnNextPhaseBtn.textContent = alreadyVoted ? 'VOTO REGISTRADO' : 'Pasar a la siguiente Fase';
  }
  renderPhaseAccuseControls(currentPhase);
}

function getAliveAccusationTargets() {
  return (state.currentGroup?.participants || []).filter((participant) => {
    if (!participant) return false;
    if (participant.uid === state.user?.uid) return false;
    if (isParticipantDead(participant.uid)) return false;
    return true;
  });
}

function renderPhaseAccuseControls(currentPhase) {
  if (!phaseAccuseBtn || !phaseAccuseList) return;
  const canShowButton = state.gameRole === 'detective'
    && state.gameState?.status === 'active'
    && currentPhase === 4
    && !isParticipantDead(state.user?.uid);

  phaseAccuseBtn.classList.toggle('hidden', !canShowButton);
  phaseAccuseBtn.disabled = !canShowButton;
  phaseAccuseList.classList.add('hidden');
  phaseAccuseList.innerHTML = '';
}

function openPhaseAccuseList() {
  if (!phaseAccuseList) return;
  const targets = getAliveAccusationTargets();
  if (!targets.length) {
    phaseAccuseList.innerHTML = '<p class="meta">No hay personajes vivos para acusar.</p>';
    phaseAccuseList.classList.remove('hidden');
    return;
  }

  phaseAccuseList.innerHTML = '';
  targets.forEach((participant) => {
    const character = state.characters.find((item) => item.id === participant.characterId);
    const characterName = character?.nombre || participant.botCharacterName || participant.name || 'Sin personaje';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary';
    button.textContent = characterName;
    button.addEventListener('click', async () => {
      try {
        await accuseParticipant(participant.uid);
        phaseAccuseList.classList.add('hidden');
      } catch (error) {
        console.error('No se pudo acusar al participante desde Fases:', error);
        alert('No se pudo completar la acusación. Intenta de nuevo.');
      }
    });
    phaseAccuseList.appendChild(button);
  });
  phaseAccuseList.classList.remove('hidden');
}

function getLastKilledCharacterName() {
  const killedEntries = Object.entries(getKilledUids());
  if (!killedEntries.length) return null;
  const [lastKilledUid] = killedEntries.sort((a, b) => (a[1] || 0) - (b[1] || 0)).at(-1);
  const participant = (state.currentGroup?.participants || []).find((member) => member.uid === lastKilledUid);
  const character = state.characters.find((item) => item.id === participant?.characterId);
  return character?.nombre || participant?.name || 'UN PERSONAJE';
}

function showDawnOverlayIfNeeded() {
  if (!dawnOverlay || !state.user || state.gameState?.status !== 'active') return;
  const currentPhase = state.gameState?.currentPhase || 1;
  if (currentPhase !== 2) return;
  const phaseStamp = `${state.currentGroup?.id || 'no-group'}-${currentPhase}-${state.gameState?.phaseUpdatedAt || 0}`;
  if (state.dawnAlertShownForPhase === phaseStamp) return;

  const killedName = getLastKilledCharacterName() || 'UN PERSONAJE';
  dawnMessage.textContent = `${killedName.toUpperCase()} HA SIDO ASESINADO DURANTE LA NOCHE`;
  dawnOverlay.classList.remove('hidden');
  state.dawnAlertShownForPhase = phaseStamp;
}

function getParticipantDisplayName(uid) {
  const participant = (state.currentGroup?.participants || []).find((member) => member.uid === uid);
  const character = state.characters.find((item) => item.id === participant?.characterId);
  return character?.nombre || participant?.name || 'ALGUIEN';
}

function showExecutionOverlayIfNeeded() {
  const execution = state.gameState?.lastExecution;
  if (!execution?.uid) return;
  const executionKey = `${execution.uid}-${execution.at || 0}-${execution.method || 'NA'}`;
  if (state.lastExecutionAlertKey === executionKey) return;
  state.lastExecutionAlertKey = executionKey;

  const executedName = getParticipantDisplayName(execution.uid).toUpperCase();
  const methodLabelMap = {
    HORCA: 'CONDENADO A LA HORCA',
    'SILLA ELECTRICA': 'CONDENADO A LA SILLA ELECTRICA',
    FUSILAMIENTO: 'FUSILADO',
  };
  alert(`${executedName} FUE ${methodLabelMap[execution.method] || 'EJECUTADO'}`);
  if (execution.wasKiller) {
    alert(`${executedName} ERA EL ASESINO, EL PUEBLO ESTÁ A SALVO GRACIAS AL DETECTIVE`);
  } else {
    alert(`${executedName} NO ERA EL ASESINO, EL DETECTIVE MATÓ A UN INOCENTE`);
  }
}

function closeDawnOverlay() {
  dawnOverlay?.classList.add('hidden');
}

function openCrimeScenePhasesTab() {
  crimeTabCluesBtn?.classList.remove('active');
  crimeTabCharactersBtn?.classList.remove('active');
  crimeTabPhasesBtn?.classList.add('active');
  crimeCharactersPanel?.classList.add('hidden');
  crimeCharactersDetailPanel?.classList.add('hidden');
  crimePhasesPanel?.classList.remove('hidden');
  crimeCluesPanel?.classList.add('hidden');
  renderPhasesPanel();
}

crimeTabPhasesBtn?.addEventListener('click', openCrimeScenePhasesTab);

function openCrimeSceneCluesTab() {
  crimeTabCharactersBtn?.classList.remove('active');
  crimeTabPhasesBtn?.classList.remove('active');
  crimeTabCluesBtn?.classList.add('active');
  crimeCharactersPanel?.classList.add('hidden');
  crimeCharactersDetailPanel?.classList.add('hidden');
  crimePhasesPanel?.classList.add('hidden');
  crimeCluesPanel?.classList.remove('hidden');
  renderClues();
}

crimeTabCluesBtn?.addEventListener('click', openCrimeSceneCluesTab);

function subscribeClues() {
  if (!state.currentGroup?.id) return;
  if (state.cluesUnsubscribe) state.cluesUnsubscribe();
  const cluesRef = ref(database, `gameClues/${state.currentGroup.id}`);
  const unsubscribe = onValue(cluesRef, (snapshot) => {
    const cluesObj = snapshot.val() || {};
    state.clues = Object.values(cluesObj).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    renderClues();
  });
  state.cluesUnsubscribe = unsubscribe;
}

async function voteNextPhase() {
  if (!state.currentGroup?.id || !state.user || state.gameState?.status !== 'active') return;
  if (isParticipantDead(state.user.uid)) return;
  const gameRef = ref(database, `games/${state.currentGroup.id}`);
  const snapshot = await get(gameRef);
  const latestGame = snapshot.val() || state.gameState || {};
  const currentPhase = Math.min(Math.max(latestGame.currentPhase || 1, 1), DAY_PHASES.length);
  const phaseVotes = latestGame.phaseVotes || {};
  if (phaseVotes[state.user.uid]) return;

  const updatedVotes = { ...phaseVotes, [state.user.uid]: true };
  const realPlayerUids = getRealPlayerUids();
  const allVoted = realPlayerUids.length > 0 && realPlayerUids.every((uid) => Boolean(updatedVotes[uid]));

  await set(gameRef, {
    ...latestGame,
    status: latestGame.status || 'active',
    currentPhase: allVoted ? (currentPhase % DAY_PHASES.length) + 1 : currentPhase,
    phaseVotes: allVoted ? {} : updatedVotes,
    phaseUpdatedAt: Date.now(),
  });
}

async function maybeRunBotKillerTurn() {
  if (!state.currentGroup?.id) return;
  const participants = state.currentGroup?.participants || [];
  const killer = participants.find((member) => member.uid === state.gameState?.killerUid);
  if (!killer?.fake) return;
  if (state.gameState?.status !== 'active') return;
  if ((state.gameState?.currentPhase || 1) !== 1) return;

  const gameRef = ref(database, `games/${state.currentGroup.id}`);
  const snapshot = await get(gameRef);
  const latestGame = snapshot.val() || {};
  if ((latestGame.currentPhase || 1) !== 1) return;

  const phaseKey = `${latestGame.currentPhase || 1}:${latestGame.phaseUpdatedAt || 0}`;
  if (latestGame.botKillResolvedFor === phaseKey) return;

  const latestParticipants = state.currentGroup?.participants || [];
  const killedUids = latestGame.killedUids || {};
  const aliveTargets = latestParticipants
    .filter((member) => member.uid !== latestGame.killerUid)
    .filter((member) => member.uid !== latestGame.detectiveUid)
    .filter((member) => !killedUids[member.uid]);

  const previousPhaseOneVictimUid = latestGame.lastPhaseOneVictimUid;
  const candidates = aliveTargets.length > 1 && previousPhaseOneVictimUid
    ? aliveTargets.filter((member) => member.uid !== previousPhaseOneVictimUid)
    : aliveTargets;

  const randomTarget = candidates[Math.floor(Math.random() * candidates.length)];
  if (!randomTarget?.uid) return;

  await set(gameRef, {
    ...latestGame,
    status: latestGame.status || 'active',
    killedUids: {
      ...killedUids,
      [randomTarget.uid]: Date.now(),
    },
    lastKillAt: Date.now(),
    lastKillBy: latestGame.killerUid,
    lastPhaseOneVictimUid: randomTarget.uid,
    botKillResolvedFor: phaseKey,
  });
}

function updateAuthUI() {
  const isLoggedIn = Boolean(state.user);
  addCharacterBtn.disabled = !isLoggedIn;
  googleLoginBtn.classList.toggle('hidden', isLoggedIn);
  logoutBtn.classList.toggle('hidden', !isLoggedIn);

  if (isLoggedIn) {
    const userName = state.user.displayName || state.user.email;
    authStatus.textContent = `Sesión activa: ${userName}`;
  } else {
    authStatus.textContent = 'No autenticado';
    closeModal();
  }

  renderSuspects();
updateCrimeSceneEndState();
  updatePlayButtons();
}

function openModal() {
  if (!state.user) {
    alert('Debes iniciar sesión con Google para crear personajes.');
    return;
  }

  modalOverlay.classList.remove('hidden');
}

function closeModal() {
  form.reset();
  state.editingCharacterId = null;
  modalOverlay.querySelector('.modal-header h3').textContent = 'Nuevo personaje';
  saveCharacterBtn.textContent = 'Guardar';
  updateImageSource();
  modalOverlay.classList.add('hidden');
}

function openCharacterDetail(character) {
  characterDetailContent.innerHTML = `
    <img src="${character.image}" alt="${character.nombre}" />
    <h4>${character.nombre}</h4>
    <p class="meta"><strong>Autor:</strong> ${character.createdByName || 'N/D'}</p>
    <p class="meta"><strong>Historia:</strong> ${character.historia}</p>
    <p class="meta"><strong>Género:</strong> ${character.genero}</p>
    <p class="meta"><strong>Estatura:</strong> ${character.estatura}</p>
    <p class="meta"><strong>Cabello:</strong> ${character.cabello}</p>
    <p class="meta"><strong>Ojos:</strong> ${character.ojos}</p>
    <p class="meta"><strong>Tez:</strong> ${character.tez}</p>
    <p class="meta"><strong>Rasgos:</strong> ${character.rasgos}</p>
    <p class="meta"><strong>Traumas/Fijaciones:</strong> ${character.traumas}</p>
    <p class="meta"><strong>Miedo oculto:</strong> ${character.miedo}</p>
    ${character.dialogo ? `<p class="meta"><strong>Postmorten:</strong> ${character.dialogo}</p>` : ''}
    <p class="meta"><strong>Modo de edición:</strong> para editar este personaje usa click derecho sobre su tarjeta y luego "Editar".</p>
  `;
  characterDetailOverlay.classList.remove('hidden');
}

function closeCharacterDetail() {
  characterDetailOverlay.classList.add('hidden');
}

function hideGalleryContextMenu() {
  galleryContextMenu.classList.add('hidden');
  state.contextCharacterId = null;
}

function hideCrimeContextMenu() {
  crimeContextMenu.classList.add('hidden');
  delete crimeContextMenu.dataset.action;
  state.contextCrimeTargetUid = null;
}

function openEditCharacter(characterId) {
  const character = state.characters.find((item) => item.id === characterId);
  if (!character) return;

  state.editingCharacterId = characterId;
  modalOverlay.querySelector('.modal-header h3').textContent = 'Editar personaje';
  saveCharacterBtn.textContent = 'Guardar cambios';

  document.getElementById('nombre').value = character.nombre || '';
  document.getElementById('historia').value = character.historia || '';
  document.getElementById('genero').value = character.genero || '';
  document.getElementById('estatura').value = character.estatura || '';
  document.getElementById('cabello').value = character.cabello || '';
  document.getElementById('ojos').value = character.ojos || '';
  document.getElementById('tez').value = character.tez || '';
  document.getElementById('rasgos').value = character.rasgos || '';
  document.getElementById('traumas').value = character.traumas || '';
  document.getElementById('miedo').value = character.miedo || '';
  document.getElementById('dialogo').value = character.dialogo || '';

  const isUrlImage = typeof character.image === 'string' && character.image.startsWith('http');
  imageSource.value = isUrlImage ? 'url' : 'file';
  document.getElementById('imageUrl').value = isUrlImage ? character.image : '';
  updateImageSource();
  modalOverlay.classList.remove('hidden');
}

function updateImageSource() {
  const mode = imageSource.value;
  const fileInput = document.getElementById('imageFile');
  const urlInput = document.getElementById('imageUrl');

  if (mode === 'url') {
    imageFileField.classList.add('hidden');
    imageUrlField.classList.remove('hidden');
    urlInput.required = true;
    fileInput.required = false;
  } else {
    imageUrlField.classList.add('hidden');
    imageFileField.classList.remove('hidden');
    fileInput.required = true;
    urlInput.required = false;
  }
}

async function setupPresence() {
  if (!state.user) return;

  const myPresenceRef = ref(database, `presence/${state.user.uid}`);
  await set(myPresenceRef, {
    uid: state.user.uid,
    name: state.user.displayName || state.user.email || 'Usuario sin nombre',
    email: state.user.email || '',
    online: true,
    lastSeen: serverTimestamp(),
  });

  await onDisconnect(myPresenceRef).remove();

  state.presenceCleanup = () => remove(myPresenceRef);
}

function normalizeGroupMembers(rawMembers = []) {
  const realMembers = rawMembers
    .filter((member) => member && !member.fake)
    .map((member) => ({
      ...member,
      fake: false,
      section: member.section || DEFAULT_SECTION,
    }));

  const existingFakeMembers = rawMembers.filter((member) => member?.fake);

  const fakeMembers = Array.from({ length: REQUIRED_BOTS }, (_, index) => {
    const existingFake = existingFakeMembers.find((member) => member.uid === `fake-${index + 1}`);
    return {
      ...existingFake,
      uid: `fake-${index + 1}`,
      name: existingFake?.name || `Usuario ${index + 1}`,
      botCharacterName: existingFake?.botCharacterName || BOT_NAMES[index] || `BOT ${index + 1}`,
      fake: true,
      characterId: existingFake?.characterId || null,
      section: existingFake?.section || DEFAULT_SECTION,
    };
  });

  return [...realMembers, ...fakeMembers];
}

function renderCrimeScenePlayers() {
  if (!scenePlayersList || !sceneCharacterDetail || !killPlayerBtn) return;
  const participants = normalizeGroupMembers(state.currentGroup?.participants || []);

  scenePlayersList.innerHTML = '';
  state.selectedCrimeParticipantUid = null;
  killPlayerBtn.classList.add('hidden');
  killPlayerBtn.disabled = true;
  accusePlayerBtn?.classList.add('hidden');
  if (accusePlayerBtn) accusePlayerBtn.disabled = true;
  sceneCharacterDetail.innerHTML = '<p class="meta">Haz click en un jugador para ver sus características.</p>';

  participants.forEach((participant) => {
    const character = state.characters.find((item) => item.id === participant.characterId);
    const characterName = character?.nombre || participant.botCharacterName || 'Sin personaje';
    const deadLabel = isParticipantDead(participant.uid) ? ' · ☠️ Eliminado' : '';
    const sectionLabel = getParticipantSection(participant).replace('-', ' ').toUpperCase();
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'character-option';
    btn.innerHTML = `<strong>${participant.name}</strong><br><span class="meta">${characterName}${deadLabel}</span><br><span class="meta">Sección: ${sectionLabel}</span>`;
    btn.addEventListener('click', () => {
      state.selectedCrimeParticipantUid = participant.uid;
      const botDescription = BOT_DESCRIPTIONS[participant.botCharacterName] || 'Este jugador aún no eligió personaje.';
      const selectedParticipantRole = getParticipantRoleLabel(participant.uid);
      const isCurrentUserParticipant = participant.uid === state.user?.uid;
      const roleTone = selectedParticipantRole === 'Asesino' ? 'killer' : (selectedParticipantRole === 'Detective' ? 'detective' : 'civil');
      const roleEmoji = selectedParticipantRole === 'Asesino' ? '🩸' : (selectedParticipantRole === 'Detective' ? '👮' : '🕵️');
      const roleBadge = selectedParticipantRole && isCurrentUserParticipant
        ? `<span class="role-chip role-chip-${roleTone}">${roleEmoji} ${selectedParticipantRole}</span>`
        : '';
      const roleLabel = selectedParticipantRole && isCurrentUserParticipant
        ? `<div class="scene-role-banner scene-role-banner-${roleTone}"><span class="scene-role-banner-title">TU ROL</span><strong>${roleEmoji} ${selectedParticipantRole}</strong></div>`
        : '';
      const detailHeader = `<div class="scene-character-header"><h4>${character?.nombre || characterName}</h4>${roleBadge}</div>`;
      const detailContent = character
        ? `${detailHeader}<p class="meta"><strong>Historia:</strong> ${character.historia}</p><p class="meta"><strong>Rasgos:</strong> ${character.rasgos}</p><p class="meta"><strong>Traumas:</strong> ${character.traumas}</p><p class="meta"><strong>Miedo:</strong> ${character.miedo}</p>`
        : `${detailHeader}<p class="meta"><strong>Historia:</strong> ${botDescription}</p>`;
      sceneCharacterDetail.innerHTML = `${detailContent}${roleLabel}${isParticipantDead(participant.uid) ? '<p class="meta"><strong>Estado:</strong> Eliminado</p>' : ''}`;

      const showKill = canCurrentUserSeeKillButton(participant);
      killPlayerBtn.classList.toggle('hidden', !showKill);
      killPlayerBtn.disabled = !canCurrentUserKill(participant);
      const showAccuse = canCurrentUserAccuse(participant);
      accusePlayerBtn?.classList.toggle('hidden', !showAccuse);
      if (accusePlayerBtn) accusePlayerBtn.disabled = !showAccuse;
    });

    btn.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      const contextAction = getCrimeContextActionForParticipant(participant);
      if (!contextAction) {
        hideCrimeContextMenu();
        return;
      }

      state.contextCrimeTargetUid = participant.uid;
      crimeContextMenu.dataset.action = contextAction;
      if (crimeActionBtn) {
        crimeActionBtn.textContent = contextAction === 'kill' ? 'ASESINAR' : 'ACUSAR';
      }
      crimeContextMenu.style.left = `${event.pageX}px`;
      crimeContextMenu.style.top = `${event.pageY}px`;
      crimeContextMenu.classList.remove('hidden');
    });
    scenePlayersList.appendChild(btn);
  });
}

function getParticipantRoleLabel(uid) {
  if (!uid || !state.gameState) return null;
  if (uid === state.gameState.killerUid) return 'Asesino';
  if (uid === state.gameState.detectiveUid) return 'Detective';
  return 'Civil';
}


function getCrimeContextActionForParticipant(participant) {
  const canKill = canCurrentUserKill(participant);
  if (canKill) return 'kill';
  const canAccuse = canCurrentUserAccuse(participant);
  if (canAccuse) return 'accuse';
  return null;
}

function syncCurrentGroupFromPresence() {
  const sourceParticipants = state.persistedGroupParticipants.length
    ? state.persistedGroupParticipants
    : (state.currentGroup?.participants || []);
  const currentParticipantsByUid = new Map(sourceParticipants.map((member) => [member.uid, member]));

  const onlineParticipants = state.onlineUsers.map((user) => {
    const existing = currentParticipantsByUid.get(user.uid);
    return {
      uid: user.uid,
      name: user.name || user.email || 'Usuario',
      characterId: existing?.characterId || null,
      fake: false,
    };
  });

  const persistedFakeParticipants = sourceParticipants.filter((member) => member?.fake);

  const participants = normalizeGroupMembers(
    dedupeParticipants([...onlineParticipants, ...persistedFakeParticipants]),
  );

  state.currentGroup = {
    id: 'global-online-group',
    ownerId: 'system',
    ownerName: 'Sistema',
    participants,
    createdAt: Date.now(),
  };
}

function subscribeCurrentGroup() {
  if (state.groupUnsubscribe) return;
  const groupRef = ref(database, 'groups/global-online-group');
  state.groupUnsubscribe = onValue(groupRef, (snapshot) => {
    const groupData = snapshot.val();
    const participants = dedupeParticipants(groupData?.participants || []);
    state.persistedGroupParticipants = participants;

    if (!state.user) return;
    syncCurrentGroupFromPresence();
    renderSuspects();
    updatePlayButtons();
    subscribeClues();
    renderCrimeScenePlayers();
    renderPlayerProfile();
    renderCrimeSectionSelection();
    updateGameChatAvailability();
  });
}

function renderSuspects() {
  const online = state.onlineUsers.filter((user) => user.uid !== state.user?.uid);
  onlineUsersList.innerHTML = '';

  if (!state.user) {
    onlineUsersList.innerHTML = '<p class="empty-msg">Inicia sesión para ver sospechosos conectados.</p>';
  } else if (!online.length) {
    onlineUsersList.innerHTML = '<p class="empty-msg">No hay sospechosos conectados en este momento.</p>';
  } else {
    online.forEach((user) => {
      const row = document.createElement('div');
      row.className = 'suspect-card';
      row.innerHTML = `
        <div>
          <p class="suspect-name">${user.name}</p>
          <p class="meta">${user.email || 'Sin email público'}</p>
        </div>
      `;
      onlineUsersList.appendChild(row);
    });
  }

  const participants = normalizeGroupMembers(state.currentGroup?.participants || []);
  groupCount.textContent = participants.length;
  groupMembers.innerHTML = participants
    .map((member) => `<li>${member.name}${member.fake ? ` · ${member.botCharacterName}` : ''}</li>`)
    .join('');
}

googleLoginBtn.addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Error iniciando sesión con Google:', error);
    alert('No se pudo iniciar sesión con Google. Verifica la configuración de Firebase Auth.');
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    if (state.presenceCleanup) {
      await state.presenceCleanup();
      state.presenceCleanup = null;
    }
    await signOut(auth);
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    alert('No se pudo cerrar sesión. Intenta nuevamente.');
  }
});

addCharacterBtn.addEventListener('click', openModal);
cancelBtn.addEventListener('click', closeModal);
closeModalBtn.addEventListener('click', closeModal);
imageSource.addEventListener('change', updateImageSource);

modalOverlay.addEventListener('click', (event) => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!state.user) {
    alert('Tu sesión expiró. Inicia sesión otra vez para guardar.');
    return;
  }

  const selectedSource = imageSource.value;
  const imageFile = document.getElementById('imageFile').files[0];
  const imageUrl = document.getElementById('imageUrl').value.trim();

  const character = {
    nombre: document.getElementById('nombre').value.trim(),
    historia: document.getElementById('historia').value.trim(),
    genero: document.getElementById('genero').value.trim(),
    estatura: document.getElementById('estatura').value.trim(),
    cabello: document.getElementById('cabello').value.trim(),
    ojos: document.getElementById('ojos').value.trim(),
    tez: document.getElementById('tez').value.trim(),
    rasgos: document.getElementById('rasgos').value.trim(),
    traumas: document.getElementById('traumas').value.trim(),
    miedo: document.getElementById('miedo').value.trim(),
    dialogo: document.getElementById('dialogo').value.trim(),
    image: '',
    createdAt: Date.now(),
    createdBy: state.user.uid,
    createdByName: state.user.displayName || state.user.email || 'Usuario anónimo',
  };

  if (state.editingCharacterId) {
    const previousCharacter = state.characters.find((item) => item.id === state.editingCharacterId);
    if (!previousCharacter) {
      alert('No se encontró el personaje a editar.');
      return;
    }
    character.createdAt = previousCharacter.createdAt || Date.now();
    character.createdBy = previousCharacter.createdBy || state.user.uid;
    character.createdByName = previousCharacter.createdByName || state.user.displayName || state.user.email || 'Usuario anónimo';
  }

  if (selectedSource === 'url') {
    character.image = imageUrl;
  } else if (imageFile) {
    character.image = await fileToDataUrl(imageFile);
  } else if (state.editingCharacterId) {
    const previousCharacter = state.characters.find((item) => item.id === state.editingCharacterId);
    character.image = previousCharacter?.image || '';
  }

  if (!character.image) {
    alert('Debes agregar una imagen por archivo o URL.');
    return;
  }

  try {
    if (state.editingCharacterId) {
      await set(ref(database, `characters/${state.editingCharacterId}`), character);
    } else {
      await push(charactersRef, character);
    }
    closeModal();
  } catch (error) {
    console.error('Error guardando personaje en Firebase:', error);
    alert('No se pudo guardar el personaje. Revisa tu conexión o la configuración de Firebase.');
  }
});

function renderGallery() {
  galleryGrid.innerHTML = '';
  emptyMsg.style.display = state.characters.length ? 'none' : 'block';

  state.characters.forEach((character) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${character.image}" alt="${character.nombre}" />
      <div class="card-content">
        <h3>${character.nombre}</h3>
      </div>
    `;
    card.addEventListener('click', () => {
      openCharacterDetail(character);
    });
    card.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      if (!state.user) {
        alert('Debes iniciar sesión para editar o eliminar personajes.');
        return;
      }
      state.contextCharacterId = character.id;
      galleryContextMenu.style.left = `${event.pageX}px`;
      galleryContextMenu.style.top = `${event.pageY}px`;
      galleryContextMenu.classList.remove('hidden');
    });
    galleryGrid.appendChild(card);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

onValue(charactersRef, (snapshot) => {
  const data = snapshot.val() || {};
  state.characters = Object.entries(data)
    .map(([id, character]) => ({ id, ...character }))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  renderGallery();
});

onValue(presenceRef, (snapshot) => {
  const data = snapshot.val() || {};
  state.onlineUsers = Object.values(data).filter((user) => user?.online);
  if (state.user) {
    syncCurrentGroupFromPresence();
  }
  renderSuspects();
  updatePlayButtons();
});

onAuthStateChanged(auth, async (user) => {
  if (!user && state.presenceCleanup) {
    await state.presenceCleanup();
    state.presenceCleanup = null;
  }

  state.user = user;
  updateAuthUI();

  if (user) {
    setupPresence();
    subscribeCurrentGroup();

    syncCurrentGroupFromPresence();
    renderSuspects();
    updatePlayButtons();
    updateGameChatAvailability();

    onValue(ref(database, 'games'), (snapshot) => {
      const games = snapshot.val() || {};
      const groupId = state.currentGroup?.id;
      state.gameState = groupId ? games[groupId] || null : null;
      state.gameRole = state.gameState?.killerUid === state.user?.uid
        ? 'asesino'
        : (state.gameState?.detectiveUid === state.user?.uid ? 'detective' : 'civil');
      const amIDead = isParticipantDead(state.user?.uid);
      if (amIDead && !state.deathAlertShown) {
        state.deathAlertShown = true;
        alert('HAS SIDO ASESINADO');
      }
      if (!amIDead) {
        state.deathAlertShown = false;
      }
      updatePlayButtons();
      updateGameChatAvailability();
      renderCrimeScenePlayers();
      updateCrimeSceneEndState();
      if (state.gameState?.status === 'active') {
        maybeStartBotMovement();
      } else {
        stopBotMovement();
      }
      renderPlayerProfile();
      renderPhasesPanel();
      showDawnOverlayIfNeeded();
      showExecutionOverlayIfNeeded();
      maybeRunBotKillerTurn().catch((error) => {
        console.error('No se pudo ejecutar el turno automático del bot asesino:', error);
      });
    });
  } else {
    if (state.groupUnsubscribe) {
      state.groupUnsubscribe();
      state.groupUnsubscribe = null;
    }
    state.persistedGroupParticipants = [];
    state.currentGroup = null;
    stopBotMovement();
    renderSuspects();
    updatePlayButtons();
  }
});

updateImageSource();
updateAuthUI();
renderSuspects();

openPlayBtn.addEventListener('click', () => {
  switchToCrimeSceneView();
  openCharacterSelectModal();
});
openCharacterBtn.addEventListener('click', () => {
  openCharacterSelectModal({ allowDuringActiveGame: true });
});
closeCharacterSelectBtn.addEventListener('click', closeCharacterSelectModal);
closeCharacterDetailBtn.addEventListener('click', closeCharacterDetail);
characterDetailOverlay.addEventListener('click', (event) => {
  if (event.target === characterDetailOverlay) {
    closeCharacterDetail();
  }
});
contextEditBtn.addEventListener('click', () => {
  if (!state.contextCharacterId) return;
  const characterId = state.contextCharacterId;
  hideGalleryContextMenu();
  openEditCharacter(characterId);
});

contextDeleteBtn.addEventListener('click', async () => {
  if (!state.contextCharacterId) return;
  const characterId = state.contextCharacterId;
  hideGalleryContextMenu();
  const confirmed = confirm('¿Seguro que quieres eliminar este personaje? Esta acción no se puede deshacer.');
  if (!confirmed) return;

  try {
    await remove(ref(database, `characters/${characterId}`));
  } catch (error) {
    console.error('Error eliminando personaje:', error);
    alert('No se pudo eliminar el personaje. Intenta nuevamente.');
  }
});

document.addEventListener('click', () => {
  hideGalleryContextMenu();
  hideCrimeContextMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideGalleryContextMenu();
    hideCrimeContextMenu();
    closeCharacterDetail();
  }
});

crimeActionBtn?.addEventListener('click', async () => {
  if (!state.contextCrimeTargetUid) return;
  const targetUid = state.contextCrimeTargetUid;
  const action = crimeContextMenu?.dataset.action;
  hideCrimeContextMenu();
  try {
    if (action === 'accuse') {
      await accuseParticipant(targetUid);
    } else {
      await killParticipant(targetUid);
    }
  } catch (error) {
    if (action === 'accuse') {
      console.error('No se pudo acusar al participante:', error);
      alert('No se pudo completar la acusación. Intenta de nuevo.');
      return;
    }
    console.error('No se pudo asesinar al participante:', error);
    alert('No se pudo completar el asesinato. Intenta de nuevo.');
  }
});

crimeCancelBtn?.addEventListener('click', () => {
  hideCrimeContextMenu();
});
closeGameBtn.addEventListener('click', closeGameModal);
crimeRoomGrid.addEventListener('click', async (event) => {
  const sectionButton = event.target.closest('.crime-room-cell');
  if (!sectionButton) return;
  state.currentCrimeSection = sectionButton.dataset.section;

  if (state.currentGroup?.id && state.user?.uid) {
    try {
      const groupRef = ref(database, `groups/${state.currentGroup.id}`);
      const snapshot = await get(groupRef);
      const latestGroup = snapshot.val();
      if (latestGroup?.participants?.length) {
        const updatedParticipants = latestGroup.participants.map((participant) => (
          participant.uid === state.user.uid
            ? { ...participant, section: state.currentCrimeSection }
            : participant
        ));
        await set(groupRef, {
          ...latestGroup,
          participants: updatedParticipants,
        });
      }
    } catch (error) {
      console.error('No se pudo actualizar la sección del jugador:', error);
    }
  }

  renderCrimeSectionSelection();
  renderCrimeScenePlayers();
  renderPlayerProfile();
  subscribeGameChat();
  updateGameChatAvailability();
});

openCrimeSceneBtn.addEventListener('click', async () => {
  if (!state.currentGroup?.id) {
    alert('Debes unirte a un grupo antes de entrar a la partida.');
    return;
  }

  const myParticipant = (state.currentGroup?.participants || []).find((p) => p.uid === state.user?.uid);
  if (!myParticipant?.characterId) {
    alert('Debes elegir un personaje antes de entrar a la partida.');
    openCharacterSelectModal({ allowDuringActiveGame: true });
    return;
  }

  if (state.gameState?.status !== 'active') {
    await ensureGameRole();
  }
  renderPlayerProfile();
  state.currentCrimeSection = DEFAULT_SECTION;
  renderCrimeSectionSelection();
  updateGameChatAvailability();
  openGameModal();
});

characterSelectOverlay.addEventListener('click', (event) => {
  if (event.target === characterSelectOverlay) closeCharacterSelectModal();
});

gameOverlay.addEventListener('click', (event) => {
  if (event.target === gameOverlay) closeGameModal();
});

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && !gameOverlay.classList.contains('hidden')) {
    closeGameModal();
    switchToCrimeSceneView();
  }
});

confirmCharacterBtn.addEventListener('click', async () => {
  if (!state.currentGroup) {
    alert('Debes estar dentro de un grupo para jugar.');
    return;
  }

  if (!state.selectedCharacterId) {
    alert('Selecciona un personaje para continuar.');
    return;
  }

  try {
    const selectedCharacter = state.characters.find((item) => item.id === state.selectedCharacterId);
    const confirmed = confirm(
      `¿Seguro que quieres seleccionar a ${selectedCharacter?.nombre || 'este personaje'}? No podrás cambiarlo hasta que finalice la partida.`,
    );
    if (!confirmed) return;

    const participants = await saveSelectedCharacterToGroup();
    state.currentGroup = {
      ...(state.currentGroup || {}),
      participants: normalizeGroupMembers(participants),
    };

    const realPlayersReady = areAllRealPlayersReady({ participants });
    if (!realPlayersReady) {
      closeCharacterSelectModal();
      alert('Tu personaje fue guardado. La partida iniciará cuando todos los usuarios reales elijan personaje.');
      return;
    }

    if (state.gameState?.status !== 'active') {
    await ensureGameRole();
  }
    renderPlayerProfile();
    subscribeGameChat();
    closeCharacterSelectModal();
    openGameModal();
  } catch (error) {
    console.error('No se pudo guardar el personaje seleccionado:', error);
    if (error?.message === 'CHARACTER_ALREADY_TAKEN') {
      alert('Ese personaje acaba de ser elegido por otro jugador. Elige uno disponible.');
      renderCharacterOptions();
      confirmCharacterBtn.disabled = true;
      return;
    }
    alert('No se pudo iniciar el juego. Intenta de nuevo.');
  }
});




killPlayerBtn.addEventListener('click', async () => {
  if (!state.selectedCrimeParticipantUid) return;
  try {
    await killParticipant(state.selectedCrimeParticipantUid);
    killPlayerBtn.classList.add('hidden');
  } catch (error) {
    console.error('No se pudo asesinar al participante:', error);
    alert('No se pudo completar el asesinato. Intenta de nuevo.');
  }
});

accusePlayerBtn?.addEventListener('click', async () => {
  if (!state.selectedCrimeParticipantUid) return;
  try {
    await accuseParticipant(state.selectedCrimeParticipantUid);
    accusePlayerBtn.classList.add('hidden');
  } catch (error) {
    console.error('No se pudo acusar al participante:', error);
    alert('No se pudo completar la acusación. Intenta de nuevo.');
  }
});


crimeSceneNewGameBtn?.addEventListener('click', async () => {
  if (!state.currentGroup?.id) return;
  try {
    await cleanupFinishedGame(state.currentGroup.id);
    state.gameState = null;
    updatePlayButtons();
    updateCrimeSceneEndState();
    openCharacterSelectModal({ allowDuringActiveGame: true });
  } catch (error) {
    console.error('No se pudo iniciar una nueva partida:', error);
    alert('No se pudo iniciar una nueva partida. Intenta nuevamente.');
  }
});

endGameBtn.addEventListener('click', async () => {
  if (!state.currentGroup?.id) return;
  try {
    await cleanupFinishedGame(state.currentGroup.id);
    state.gameState = null;
    updatePlayButtons();
    closeGameModal();
    alert('Partida finalizada y eliminada de Firebase. Ya puedes iniciar una nueva desde JUGAR.');
  } catch (error) {
    console.error('No se pudo terminar la partida:', error);
    alert('No se pudo terminar la partida.');
  }
});

gameChatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.currentGroup?.id || !state.user || !state.currentCrimeSection) return;

  if (isParticipantDead(state.user.uid)) {
    alert('Has sido asesinado y ya no puedes chatear en vivo.');
    return;
  }

  const text = gameChatInput.value.trim();
  if (!text) return;

  const sectionPath = `gameChats/${state.currentGroup.id}/${state.currentCrimeSection}`;
  const chatNode = ref(database, sectionPath);
  await push(chatNode, {
    uid: state.user.uid,
    name: state.user.displayName || state.user.email || 'Jugador',
    text,
    createdAt: Date.now(),
  });

  const latestMessagesSnapshot = await get(query(chatNode, orderByChild('createdAt'), limitToLast(11)));
  if (latestMessagesSnapshot.exists()) {
    const entries = Object.entries(latestMessagesSnapshot.val());
    if (entries.length > 10) {
      const [oldestMessageKey] = entries[0];
      await remove(ref(database, `${sectionPath}/${oldestMessageKey}`));
    }
  }

  gameChatInput.value = '';
});

gameChatMessages.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-mark-clue]');
  if (!button || !state.currentGroup?.id) return;
  if (state.gameRole !== 'detective') {
    alert('Solo el detective puede marcar pistas.');
    return;
  }
  try {
    const payload = JSON.parse(button.dataset.markClue || '{}');
    await push(ref(database, `gameClues/${state.currentGroup.id}`), {
      uid: payload.uid || '',
      name: payload.name || 'Jugador',
      text: payload.text || '',
      createdAt: Date.now(),
      markedBy: state.user?.uid || '',
    });
    alert('Mensaje marcado como pista.');
  } catch (error) {
    console.error('No se pudo marcar la pista:', error);
    alert('No se pudo marcar la pista.');
  }
});

nextPhaseBtn?.addEventListener('click', async () => {
  try {
    await voteNextPhase();
  } catch (error) {
    console.error('No se pudo avanzar de fase:', error);
    alert('No se pudo registrar el voto para avanzar de fase.');
  }
});

phaseAccuseBtn?.addEventListener('click', () => {
  openPhaseAccuseList();
});

dawnNextPhaseBtn?.addEventListener('click', async () => {
  try {
    await voteNextPhase();
    closeDawnOverlay();
  } catch (error) {
    console.error('No se pudo avanzar de fase desde amanecer:', error);
    alert('No se pudo registrar el voto para avanzar de fase.');
  }
});

closeDawnBtn?.addEventListener('click', closeDawnOverlay);
dawnOverlay?.addEventListener('click', (event) => {
  if (event.target === dawnOverlay) closeDawnOverlay();
});
