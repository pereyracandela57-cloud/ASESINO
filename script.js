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

const menuButtons = document.querySelectorAll('.menu-btn');
const views = {
  creation: document.getElementById('creation-view'),
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
const googleLoginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const authStatus = document.getElementById('auth-status');

const onlineUsersList = document.getElementById('online-users-list');
const groupCount = document.getElementById('group-count');
const groupMembers = document.getElementById('group-members');
const openPlayBtn = document.getElementById('open-play-btn');
const characterSelectOverlay = document.getElementById('character-select-overlay');
const closeCharacterSelectBtn = document.getElementById('close-character-select-btn');
const characterOptions = document.getElementById('character-options');
const confirmCharacterBtn = document.getElementById('confirm-character-btn');
const gameOverlay = document.getElementById('game-overlay');
const closeGameBtn = document.getElementById('close-game-btn');
const endGameBtn = document.getElementById('end-game-btn');
const openCrimeSceneBtn = document.getElementById('open-crime-scene-btn');

const gameChatMessages = document.getElementById('game-chat-messages');
const gameChatForm = document.getElementById('game-chat-form');
const gameChatInput = document.getElementById('game-chat-input');
const playerProfile = document.getElementById('player-profile');
const scenePlayersList = document.getElementById('scene-players-list');
const sceneCharacterDetail = document.getElementById('scene-character-detail');
const killPlayerBtn = document.getElementById('kill-player-btn');
const galleryContextMenu = document.getElementById('gallery-context-menu');
const contextEditBtn = document.getElementById('context-edit-btn');
const contextDeleteBtn = document.getElementById('context-delete-btn');

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
  gameMessages: [],
  gameState: null,
  selectedCrimeParticipantUid: null,
  editingCharacterId: null,
  contextCharacterId: null,
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
  return getRealGroupMembers()
    .map((member) => member.characterId)
    .filter(Boolean);
}


function areAllRealPlayersReady(group = state.currentGroup) {
  const realMembers = (group?.participants || []).filter((member) => !member.fake);
  return realMembers.length > 0 && realMembers.every((member) => Boolean(member.characterId));
}

function canStartNewGame() {
  return !state.gameState || state.gameState.status !== 'active';
}

function updatePlayButtons() {
  const canStart = Boolean(state.user && state.currentGroup?.id && canStartNewGame());
  openPlayBtn.disabled = !canStart;
  openPlayBtn.textContent = canStart ? 'JUGAR' : 'PARTIDA EN CURSO';

  const canOpenScene = Boolean(state.user && state.currentGroup?.id);
  openCrimeSceneBtn.disabled = !canOpenScene;
  endGameBtn.disabled = !(canOpenScene && state.gameState?.status === 'active');
  renderCrimeScenePlayers();
}

function openCharacterSelectModal() {
  if (!state.user) {
    alert('Debes iniciar sesión para jugar.');
    return;
  }

  if (!canStartNewGame()) {
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

  if (!gameState?.killerUid) {
    const members = getRealGroupMembers();
    const randomIndex = Math.floor(Math.random() * members.length);
    gameState = {
      killerUid: members[randomIndex]?.uid || state.user.uid,
      createdAt: Date.now(),
      status: 'active',
    };
    await set(gameStateRef, gameState);
  }

  state.gameState = gameState;
  state.gameRole = gameState.killerUid === state.user.uid ? 'asesino' : 'civil';
  updatePlayButtons();
}

function renderPlayerProfile() {
  const character = getMyCharacter();
  const image = character?.image || 'https://via.placeholder.com/320x320?text=Sin+foto';
  const name = character?.nombre || state.user?.displayName || 'Jugador';
  const roleLabel = state.gameRole === 'asesino' ? 'ASESINO' : 'CIVIL';
  const isDead = isParticipantDead(state.user?.uid);
  const bloodBadge = state.gameRole === 'asesino' ? '<span class="blood-drop" title="Asesino">🩸</span>' : '';

  playerProfile.innerHTML = `
    <div class="profile-image-wrap">
      <img src="${image}" alt="${name}" class="profile-image" />
      ${bloodBadge}
    </div>
    <h4>${name}</h4>
    <p class="meta"><strong>Rol secreto:</strong> ${roleLabel}</p>
    <p class="meta">Este rol solo lo ves tú.</p>
    ${isDead ? '<p class="meta"><strong>Estado:</strong> Eliminado (solo espectador)</p>' : ''}
  `;
}

function renderGameChat() {
  gameChatMessages.innerHTML = state.gameMessages
    .slice(-15)
    .map((msg) => `<p><strong>${msg.name}:</strong> ${msg.text}</p>`)
    .join('');
  gameChatMessages.scrollTop = gameChatMessages.scrollHeight;
}

function subscribeGameChat() {
  if (!state.currentGroup?.id) return;
  if (state.gameChatUnsubscribe) state.gameChatUnsubscribe();

  state.gameChatJoinAt = Date.now();
  state.gameMessages = [];
  renderGameChat();

  const chatRef = query(ref(database, `gameChats/${state.currentGroup.id}`), orderByChild('createdAt'), limitToLast(15));
  state.gameChatUnsubscribe = onChildAdded(chatRef, (snapshot) => {
    const message = snapshot.val();
    if (!message || message.createdAt < state.gameChatJoinAt) return;

    state.gameMessages.push(message);
    state.gameMessages = state.gameMessages.slice(-15);
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

function canCurrentUserKill(targetParticipant) {
  if (!targetParticipant || targetParticipant.fake) return false;
  if (state.gameRole !== 'asesino') return false;
  if (state.gameState?.status !== 'active') return false;
  if (targetParticipant.uid === state.user?.uid) return false;
  if (isParticipantDead(targetParticipant.uid)) return false;
  return true;
}

function updateGameChatAvailability() {
  const dead = isParticipantDead(state.user?.uid);
  gameChatInput.disabled = dead;
  gameChatForm.querySelector('button[type="submit"]').disabled = dead;
  gameChatInput.placeholder = dead
    ? 'Has sido asesinado. Solo puedes observar la partida.'
    : 'Escribe un mensaje...';
}

async function killParticipant(targetUid) {
  if (!state.currentGroup?.id || !targetUid) return;
  if (state.gameRole !== 'asesino') return;

  const gameRef = ref(database, `games/${state.currentGroup.id}`);
  const snapshot = await get(gameRef);
  const latestGame = snapshot.val() || state.gameState || {};
  const killedUids = latestGame.killedUids || {};

  if (killedUids[targetUid]) return;

  await set(gameRef, {
    ...latestGame,
    status: latestGame.status || 'active',
    killedUids: {
      ...killedUids,
      [targetUid]: Date.now(),
    },
  });
}
function renderCharacterOptions() {
  characterOptions.innerHTML = '';
  const takenIds = new Set(getTakenCharacterIds());

  state.characters.forEach((character) => {
    const isTaken = takenIds.has(character.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `character-option${isTaken ? ' blocked' : ''}`;
    button.disabled = isTaken;
    button.innerHTML = `<strong>${character.nombre}</strong><br><span class="meta">${isTaken ? 'Bloqueado' : 'Disponible'}</span>`;

    if (!isTaken) {
      button.addEventListener('click', () => {
        state.selectedCharacterId = character.id;
        renderCharacterOptions();
        confirmCharacterBtn.disabled = false;
      });
    }

    if (state.selectedCharacterId === character.id) {
      button.classList.add('selected');
    }

    characterOptions.appendChild(button);
  });
}

async function saveSelectedCharacterToGroup() {
  if (!state.user || !state.selectedCharacterId || !state.currentGroup?.id) return;

  const groupRef = ref(database, `groups/${state.currentGroup.id}`);
  const groupSnapshot = await get(groupRef);
  const latestGroup = groupSnapshot.val() || state.currentGroup;
  const latestParticipants = latestGroup.participants || [];
  const selectedIsTaken = latestParticipants.some(
    (member) => !member.fake && member.uid !== state.user.uid && member.characterId === state.selectedCharacterId,
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
        const freeCharacter = state.characters.find((character) => !usedCharacterIds.has(character.id));
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

  return finalParticipants;
}

menuButtons.forEach((button) => {
  button.addEventListener('click', () => {
    menuButtons.forEach((b) => b.classList.remove('active'));
    Object.values(views).forEach((view) => view.classList.remove('active'));
    button.classList.add('active');
    views[button.dataset.view].classList.add('active');
  });
});

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

function hideGalleryContextMenu() {
  galleryContextMenu.classList.add('hidden');
  state.contextCharacterId = null;
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
  const realMembers = rawMembers.filter(Boolean);
  if (realMembers.length >= 5) return realMembers;

  const missingCount = 5 - realMembers.length;
  const fakeMembers = Array.from({ length: missingCount }, (_, index) => ({
    uid: `fake-${index + 1}`,
    name: `Usuario ${index + 1}`,
    fake: true,
  }));

  return [...realMembers, ...fakeMembers];
}

function renderCrimeScenePlayers() {
  if (!scenePlayersList || !sceneCharacterDetail || !killPlayerBtn) return;
  const participants = normalizeGroupMembers(state.currentGroup?.participants || []);

  scenePlayersList.innerHTML = '';
  state.selectedCrimeParticipantUid = null;
  killPlayerBtn.classList.add('hidden');
  killPlayerBtn.disabled = true;
  sceneCharacterDetail.innerHTML = '<p class="meta">Haz click en un jugador para ver sus características.</p>';

  participants.forEach((participant) => {
    const character = state.characters.find((item) => item.id === participant.characterId);
    const deadLabel = isParticipantDead(participant.uid) ? ' · ☠️ Eliminado' : '';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'character-option';
    btn.innerHTML = `<strong>${participant.name}</strong><br><span class="meta">${character?.nombre || 'Sin personaje'}${deadLabel}</span>`;
    btn.addEventListener('click', () => {
      state.selectedCrimeParticipantUid = participant.uid;
      sceneCharacterDetail.innerHTML = character
        ? `<h4>${character.nombre}</h4><p class="meta"><strong>Historia:</strong> ${character.historia}</p><p class="meta"><strong>Rasgos:</strong> ${character.rasgos}</p><p class="meta"><strong>Traumas:</strong> ${character.traumas}</p><p class="meta"><strong>Miedo:</strong> ${character.miedo}</p>${isParticipantDead(participant.uid) ? '<p class="meta"><strong>Estado:</strong> Eliminado</p>' : ''}`
        : '<p class="meta">Este jugador aún no eligió personaje.</p>';

      const showKill = canCurrentUserKill(participant);
      killPlayerBtn.classList.toggle('hidden', !showKill);
      killPlayerBtn.disabled = !showKill;
    });
    scenePlayersList.appendChild(btn);
  });
}

function syncCurrentGroupFromPresence() {
  const participants = normalizeGroupMembers(
    dedupeParticipants(
      state.onlineUsers.map((user) => ({
        uid: user.uid,
        name: user.name || user.email || 'Usuario',
      })),
    ),
  );

  state.currentGroup = {
    id: 'global-online-group',
    ownerId: 'system',
    ownerName: 'Sistema',
    participants,
    createdAt: Date.now(),
  };
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
    .map((member) => `<li>${member.name}${member.fake ? ' (falso)' : ''}</li>`)
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
        <p class="meta"><strong>Autor:</strong> ${character.createdByName || 'N/D'}</p>
        <p class="meta"><strong>Género:</strong> ${character.genero}</p>
        <p class="meta"><strong>Estatura:</strong> ${character.estatura}</p>
        <p class="meta"><strong>Cabello:</strong> ${character.cabello} | <strong>Ojos:</strong> ${character.ojos}</p>
        <p class="meta"><strong>Tez:</strong> ${character.tez}</p>
        <p class="meta"><strong>Historia:</strong> ${character.historia}</p>
        <p class="meta"><strong>Rasgos:</strong> ${character.rasgos}</p>
        <p class="meta"><strong>Traumas/Fijaciones:</strong> ${character.traumas}</p>
        <p class="meta"><strong>Miedo Oculto:</strong> ${character.miedo}</p>
        ${character.dialogo ? `<p class="meta"><strong>Postmorten:</strong> ${character.dialogo}</p>` : ''}
      </div>
    `;
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

    syncCurrentGroupFromPresence();
    renderSuspects();
    updatePlayButtons();
    updateGameChatAvailability();

    onValue(ref(database, 'games'), (snapshot) => {
      const games = snapshot.val() || {};
      const groupId = state.currentGroup?.id;
      state.gameState = groupId ? games[groupId] || null : null;
      updatePlayButtons();
    });
  } else {
    state.currentGroup = null;
    renderSuspects();
    updatePlayButtons();
  }
});

updateImageSource();
updateAuthUI();
renderSuspects();

openPlayBtn.addEventListener('click', () => {
  menuButtons.forEach((b) => b.classList.remove('active'));
  Object.values(views).forEach((view) => view.classList.remove('active'));
  document.querySelector('[data-view="crime-scene"]').classList.add('active');
  views['crime-scene'].classList.add('active');
  openCharacterSelectModal();
});
closeCharacterSelectBtn.addEventListener('click', closeCharacterSelectModal);
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
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') hideGalleryContextMenu();
});
closeGameBtn.addEventListener('click', closeGameModal);
openCrimeSceneBtn.addEventListener('click', async () => {
  if (!state.currentGroup?.id) {
    alert('Debes unirte a un grupo antes de entrar a la partida.');
    return;
  }

  const myParticipant = (state.currentGroup?.participants || []).find((p) => p.uid === state.user?.uid);
  if (!myParticipant?.characterId) {
    alert('Debes elegir un personaje antes de entrar a la partida.');
    openCharacterSelectModal();
    return;
  }

  if (state.gameState?.status !== 'active') {
    await ensureGameRole();
  }
  renderPlayerProfile();
  subscribeGameChat();
  openGameModal();
});

characterSelectOverlay.addEventListener('click', (event) => {
  if (event.target === characterSelectOverlay) closeCharacterSelectModal();
});

gameOverlay.addEventListener('click', (event) => {
  if (event.target === gameOverlay) closeGameModal();
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
    const participants = await saveSelectedCharacterToGroup();

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

endGameBtn.addEventListener('click', async () => {
  if (!state.currentGroup?.id) return;
  try {
    await set(ref(database, `games/${state.currentGroup.id}`), {
      ...(state.gameState || {}),
      status: 'finished',
      endedAt: Date.now(),
    });
    closeGameModal();
    alert('Partida finalizada. Ya puedes iniciar una nueva desde JUGAR.');
  } catch (error) {
    console.error('No se pudo terminar la partida:', error);
    alert('No se pudo terminar la partida.');
  }
});

gameChatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.currentGroup?.id || !state.user) return;

  if (isParticipantDead(state.user.uid)) {
    alert('Has sido asesinado y ya no puedes chatear en vivo.');
    return;
  }

  const text = gameChatInput.value.trim();
  if (!text) return;

  const chatNode = ref(database, `gameChats/${state.currentGroup.id}`);
  await push(chatNode, {
    uid: state.user.uid,
    name: state.user.displayName || state.user.email || 'Jugador',
    text,
    createdAt: Date.now(),
  });

  gameChatInput.value = '';
});
