// ===== CONFIG =====
const XP_BASE = 30;
const XP_NIVEL_BASE = 80;
const FATOR_NIVEL = 1.08;
const NIVEL_MAX = 100;
const MOEDAS_ACERTO = 5;
const MOEDAS_ERRO = 1;
const BONUS_STREAK_MAX = 10;
const MULT_DIFICULDADE = { facil: 1, medio: 1.5, dificil: 2.5 };
const TEMPO_POR_DIFICULDADE = { facil: 10, medio: 15, dificil: 20 };

// ===== ESTADO DO QUIZ =====
let perguntas = [];
let perguntaAtual = 0;
let pontuacao = 0;
let perguntaRespondida = false;
let vidas = 3;
let generoAtual = null;
let quizAtivo = false;
let poderUsado = false;
let poderUsosRestantes = 1;
let poderEfeito = null;
let timerInterval = null;
let tempoRestante = 0;
let tempoResposta = 0;
let generosJogados = [];
let boostTimerInterval = null;
let boostTempoRestante = 0;
let boostAtual = null;

// ===== PODERES =====
const poderesDisponiveis = {
    naruto: { nome: 'Modo Sabio', desc: '+50 XP no proximo acerto', icone: '🍃', tipo: 'xp_bonus', cor: '#f7971e' },
    goku: { nome: 'Kamehameha', desc: 'Elimina 2 opcoes erradas', icone: '⚡', tipo: 'eliminar_opcoes', cor: '#3b82f6' },
    luffy: { nome: 'Gomu Gomu', desc: 'Pula a questao sem perder vida', icone: '🪨', tipo: 'pular_questao', cor: '#ef4444' },
    pikachu: { nome: 'Choque do Trovao', desc: 'Revela a resposta certa por 2s', icone: '⚡', tipo: 'revelar_resposta', cor: '#fbbf24' },
    tanjiro: { nome: 'Respiracao da Agua', desc: 'Recupera 1 vida', icone: '🌊', tipo: 'curar_vida', cor: '#4ade80' },
    gojo: { nome: 'Roxo (Hollow Purple)', desc: 'PASSAR AUTOMATICO na questao! 💜', icone: '💜', tipo: 'passar_questao', cor: '#a855f7' },
    mikasa: { nome: 'Laminas Titanicas', desc: 'Dobra moedas no proximo acerto', icone: '🗡️', tipo: 'moedas_dobradas', cor: '#8b5cf6' },
    sailor: { nome: 'Moon Healing', desc: 'Restaura TODAS as vidas!', icone: '🌙', tipo: 'curar_tudo', cor: '#ec4899' },
    vegeta: { nome: 'Final Flash', desc: 'Triplica XP no proximo acerto', icone: '💥', tipo: 'xp_triplo', cor: '#14b8a6' },
    itachi: { nome: 'Tsukuyomi', desc: 'Revela a resposta certa por 3s', icone: '🔮', tipo: 'revelar_tempo', cor: '#f87171' },
    meliodas: { nome: 'Full Counter', desc: 'Chance de refletir o dano e nao perder vida ao errar', icone: '🛡️', tipo: 'refletir_dano', cor: '#fbbf24' }
};

// ===== CONQUISTAS =====
const conquistas = [
    { id: 'primeira_resposta', nome: 'Primeiro Passo', desc: 'Responda sua primeira pergunta', icone: '🌱', condicao: u => u.totalPerguntas >= 1, recompensaXP: 50 },
    { id: 'dez_acertos', nome: 'Aprendiz', desc: 'Acerte 10 perguntas no total', icone: '📚', condicao: u => u.totalAcertos >= 10, recompensaXP: 100 },
    { id: 'cinquenta_acertos', nome: 'Estudioso', desc: 'Acerte 50 perguntas no total', icone: '🎓', condicao: u => u.totalAcertos >= 50, recompensaXP: 300 },
    { id: 'cem_acertos', nome: 'Sabe-Tudo', desc: 'Acerte 100 perguntas no total', icone: '🧠', condicao: u => u.totalAcertos >= 100, recompensaXP: 800 },
    { id: 'perfeito', nome: 'PERFEITO!', desc: 'Faca um jogo perfeito (100%)', icone: '⭐', condicao: () => false, recompensaXP: 200, especial: true },
    { id: 'streak_5', nome: 'Em Serie', desc: 'Acerte 5 perguntas seguidas', icone: '🔥', condicao: u => u.maxStreak >= 5, recompensaXP: 150 },
    { id: 'streak_10', nome: 'Imparavel', desc: 'Acerte 10 perguntas seguidas', icone: '💥', condicao: u => u.maxStreak >= 10, recompensaXP: 400 },
    { id: 'colecionador', nome: 'Colecionador', desc: 'Compre 3 personagens', icone: '🎭', condicao: u => u.inventario.personagens.length >= 3, recompensaXP: 200 },
    { id: 'nivel_10', nome: 'Level Up!', desc: 'Atinga o nivel 10', icone: '⬆️', condicao: u => u.nivel >= 10, recompensaXP: 300 },
    { id: 'nivel_25', nome: 'Veterano', desc: 'Atinga o nivel 25', icone: '🏅', condicao: u => u.nivel >= 25, recompensaXP: 600 },
    { id: 'rico', nome: 'Milionario', desc: 'Acumule 500 moedas', icone: '🪙', condicao: u => u.moedas >= 500, recompensaXP: 200 },
    { id: 'todos_generos', nome: 'Explorador', desc: 'Jogue em todos os generos disponiveis', icone: '🌍', condicao: () => false, recompensaXP: 500, especial: true },
    { id: 'dez_erros', nome: 'Errando Aprende-se', desc: 'Erre 10 perguntas no total', icone: '💪', condicao: u => (u.totalPerguntas - u.totalAcertos) >= 10, recompensaXP: 100 },
    { id: 'cinquenta_erros', nome: 'Persistente', desc: 'Erre 50 perguntas no total', icone: '🛡️', condicao: u => (u.totalPerguntas - u.totalAcertos) >= 50, recompensaXP: 300 },
    { id: 'rapido', nome: 'Relampago', desc: 'Responda em menos de 3 segundos', icone: '⚡', condicao: () => false, recompensaXP: 100, especial: true },
    { id: 'duzentos_acertos', nome: 'Mestre dos Quiz', desc: 'Acerte 200 perguntas no total', icone: '🏆', condicao: u => u.totalAcertos >= 200, recompensaXP: 1500 },
    { id: 'quinhentos_acertos', nome: 'Enciclopedia', desc: 'Acerte 500 perguntas no total', icone: '📖', condicao: u => u.totalAcertos >= 500, recompensaXP: 3000 },
    { id: 'mil_acertos', nome: 'Lenda Viva', desc: 'Acerte 1000 perguntas no total', icone: '👑', condicao: u => u.totalAcertos >= 1000, recompensaXP: 8000 },
    { id: 'streak_15', nome: 'Inferno', desc: 'Acerte 15 perguntas seguidas', icone: '🔥', condicao: u => u.maxStreak >= 15, recompensaXP: 800 },
    { id: 'streak_20', nome: 'Deus do Quiz', desc: 'Acerte 20 perguntas seguidas', icone: '⚡', condicao: u => u.maxStreak >= 20, recompensaXP: 2000 },
    { id: 'nivel_50', nome: 'Lendario', desc: 'Atinga o nivel 50', icone: '💎', condicao: u => u.nivel >= 50, recompensaXP: 2000 },
    { id: 'nivel_69', nome: 'Maximo', desc: 'Atinga o nivel maximo (69)', icone: '🌟', condicao: u => u.nivel >= 69, recompensaXP: 5000 },
    { id: 'rico_1000', nome: 'Magnata', desc: 'Acumule 1000 moedas', icone: '💰', condicao: u => u.moedas >= 1000, recompensaXP: 500 },
    { id: 'rico_5000', nome: 'Tio Patinhas', desc: 'Acumule 5000 moedas', icone: '🤑', condicao: u => u.moedas >= 5000, recompensaXP: 1500 },
    { id: 'colecionador_5', nome: 'Fanatico', desc: 'Compre 5 personagens', icone: '🎪', condicao: u => (u.inventario.personagens || []).length >= 5, recompensaXP: 500 },
    { id: 'colecionador_10', nome: 'Todos os Personagens', desc: 'Compre todos os personagens', icone: '🏰', condicao: u => (u.inventario.personagens || []).length >= 10, recompensaXP: 2000 },
    { id: 'rank_ouro', nome: 'Classe Alta', desc: 'Compre o rank Ouro', icone: '🥇', condicao: u => (u.inventario.ranks || []).includes('ouro'), recompensaXP: 400 },
    { id: 'rank_mestre', nome: 'Supremo', desc: 'Compre o rank Mestre', icone: '👑', condicao: u => (u.inventario.ranks || []).includes('mestre'), recompensaXP: 1500 },
    { id: 'cem_erros', nome: 'Perseveranca', desc: 'Erre 100 perguntas no total', icone: '🛡️', condicao: u => (u.totalPerguntas - u.totalAcertos) >= 100, recompensaXP: 600 },
    { id: 'trezentos_erros', nome: 'Inquebravel', desc: 'Erre 300 perguntas no total', icone: '⛓️', condicao: u => (u.totalPerguntas - u.totalAcertos) >= 300, recompensaXP: 1500 },
    { id: 'poder_usado', nome: 'Poderoso', desc: 'Use um poder pela primeira vez', icone: '💜', condicao: () => false, recompensaXP: 100, especial: true },
    { id: 'todos_poderes', nome: 'Colecionador de Poderes', desc: 'Use todos os poderes disponiveis', icone: '🔮', condicao: () => false, recompensaXP: 2000, especial: true },
];

// ===== PERGUNTAS - GAMES =====
const perguntasGames = [
    { pergunta: "Qual e o nome do protagonista da serie de jogos 'The Legend of Zelda'?", opcoes: ["Zelda", "Ganon", "Link", "Sheik"], correta: 2, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Em 'Minecraft', qual picareta e necessaria para minerar diamante?", opcoes: ["Madeira", "Pedra", "Ferro", "Ouro"], correta: 2, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual jogo popularizou o genero Battle Royale?", opcoes: ["Fortnite", "PUBG", "Apex Legends", "H1Z1"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Qual empresa criou o 'Super Mario'?", opcoes: ["Sega", "Sony", "Microsoft", "Nintendo"], correta: 3, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Em 'Among Us', quantos impostores podem haver em uma partida com 10 jogadores?", opcoes: ["1", "2", "3", "4"], correta: 2, cat: 'games', dificuldade: 'medio' },
    { pergunta: "RPG de mundo aberto da CD Projekt Red?", opcoes: ["Skyrim", "The Witcher 3", "Dark Souls", "Elden Ring"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Mascote do jogo 'Sonic the Hedgehog'?", opcoes: ["Lobo", "Ourico", "Raposa", "Gato"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Moeda virtual do 'Fortnite'?", opcoes: ["V-Bucks", "R6 Credits", "COD Points", "Apex Coins"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Jogo mais vendido de todos os tempos?", opcoes: ["GTA V", "Tetris", "Minecraft", "Wii Sports"], correta: 2, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Golpe especial mais famoso de Ryu em 'Street Fighter'?", opcoes: ["Sonic Boom", "Hadouken", "Shoryuken", "Tatsumaki"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Primeiro jogo com o personagem 'Solid Snake'?", opcoes: ["Metal Gear Solid", "Metal Gear", "Snake's Revenge", "MGS2"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Tipo do Pokemon inicial 'Charmander'?", opcoes: ["Agua", "Planta", "Fogo", "Eletrico"], correta: 2, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual jogo originou o termo 'Roguelike'?", opcoes: ["Rogue", "Spelunky", "Isaac", "Hades"], correta: 0, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Empresa criadora da Unreal Engine?", opcoes: ["Valve", "Epic Games", "Unity", "Ubisoft"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Filho de Kratos em 'God of War' (2018)?", opcoes: ["Loki", "Atreus", "Thor", "Freyr"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual plataforma e da Microsoft?", opcoes: ["PlayStation", "Xbox", "Switch", "Steam Deck"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Personagem principal de 'Halo'?", opcoes: ["Cortana", "Master Chief", "Arbiter", "Sargeant"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Primeiro e-sport na TV aberta brasileira?", opcoes: ["LoL", "Counter-Strike", "FIFA", "Street Fighter"], correta: 1, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Nome do robo ajudante em 'Portal 2'?", opcoes: ["GLaDOS", "Wheatley", "Atlas", "P-body"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Criador de 'Metal Gear Solid'?", opcoes: ["Shigeru Miyamoto", "Hideo Kojima", "Fumito Ueda", "Yoko Taro"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Em 'GTA V', qual cidade o jogo se passa?", opcoes: ["Liberty City", "Los Santos", "Vice City", "San Fierro"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Franquia de terror que popularizou 'survival horror'?", opcoes: ["Silent Hill", "Resident Evil", "Fatal Frame", "Alone in the Dark"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Jogo que inspirou o termo 'Metroidvania'?", opcoes: ["Castlevania + Metroid", "Hollow Knight", "Dead Cells", "Ori"], correta: 0, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Personagem principal da serie 'Tomb Raider'?", opcoes: ["Lara Croft", "Nathan Drake", "Jill Valentine", "Samus Aran"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Estudio criador de 'Red Dead Redemption 2'?", opcoes: ["Rockstar", "Ubisoft", "EA", "Bethesda"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual jogo tem o subtitulo 'Breath of the Wild'?", opcoes: ["Zelda", "Xenoblade", "Final Fantasy", "Dragon Quest"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "MOBA mais popular do mundo?", opcoes: ["Dota 2", "League of Legends", "Heroes of the Storm", "Smite"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Personagem principal de 'Devil May Cry'?", opcoes: ["Vergil", "Dante", "Nero", "Sparda"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Ano de lancamento do primeiro 'Super Mario Bros'?", opcoes: ["1983", "1985", "1987", "1990"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Jogo eletronico mais antigo conhecido?", opcoes: ["Pong", "Spacewar!", "Tennis for Two", "Computer Space"], correta: 2, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Nome do protagonista de 'Persona 5'?", opcoes: ["Ren Amamiya", "Yu Narukami", "Makoto Yuki", "Joker"], correta: 3, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Console mais vendido da historia?", opcoes: ["PS2", "PS4", "Switch", "DS"], correta: 0, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Criador de 'The Legend of Zelda'?", opcoes: ["Miyamoto", "Kojima", "Aonuma", "Yoshiaki Koizumi"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Em 'Overwatch', qual heroi usa uma katana?", opcoes: ["Genji", "Hanzo", "Reinhardt", "Tracer"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Sistema de 'souls' popularizado por qual jogo?", opcoes: ["Dark Souls", "Elden Ring", "Bloodborne", "Demon's Souls"], correta: 3, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Genero de 'Stardew Valley'?", opcoes: ["RPG", "Simulacao/Fazenda", "Estrategia", "Puzzle"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Nome do antagonista em 'Shadow of the Colossus'?", opcoes: ["Dormin", "Emperor", "Malus", "Agro"], correta: 0, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Ator que dublou Geralt em ingles em 'The Witcher 3'?", opcoes: ["Henry Cavill", "Doug Cockle", "Peter Kenny", "Tom Ellis"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Qual o nome original do jogo 'Street Fighter'?", opcoes: ["Fighting Street", "Street Fighter", "SF: The Beginning", "Fighter 1987"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Em qual jogo aparece o protagonista 'Doomguy'?", opcoes: ["Doom", "Quake", "Wolfenstein", "Duke Nukem"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Quantos Gym Badges sao necessarios em Pokemon para desafiar a Elite Four?", opcoes: ["6", "8", "10", "4"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Qual estudio desenvolveu 'The Last of Us'?", opcoes: ["Naughty Dog", "Insomniac", "Sucker Punch", "Santa Monica"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Jogo 'Civilization' e de qual genero?", opcoes: ["RTS", "Estrategia por Turnos", "MOBA", "RPG"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Em 'Elden Ring', qual o titulo do jogador?", opcoes: ["Elden Lord", "Tarnished", "Foul Tarnished", "Maidenless"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Qual console da Nintendo e hibrido (portatil + mesa)?", opcoes: ["Wii U", "Switch", "3DS", "Nintendo DS"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Franquia 'Assassin's Creed' e publicada por qual empresa?", opcoes: ["EA", "Ubisoft", "Activision", "Square Enix"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual jogo apresenta o personagem 'Nathan Drake'?", opcoes: ["Tomb Raider", "Uncharted", "The Last of Us", "Far Cry"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "MMORPG mais famoso da Blizzard?", opcoes: ["Overwatch", "World of Warcraft", "Diablo", "StarCraft"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Nome do protagonista de 'Half-Life'?", opcoes: ["Freeman", "Gordon Freeman", "Shepard", "Alyx"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Qual jogo foi o primeiro a ter grafismo 3D em larga escala?", opcoes: ["Super Mario 64", "Tomb Raider", "Quake", "Virtua Fighter"], correta: 0, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Em 'Mortal Kombat', qual golpe final e famoso?", opcoes: ["Fatality", "Brutality", "Animality", "Babality"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Saga 'Final Fantasy' pertence a qual empresa?", opcoes: ["Bandai Namco", "Square Enix", "Capcom", "Sega"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual o nome do mundo de 'The Witcher'?", opcoes: ["The Continent", "Midgard", "Azeroth", "Tamriel"], correta: 0, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Jogo 'Celeste' e conhecido por ser?", opcoes: ["Open World", "Plataforma Dificil", "Battle Royale", "Simulacao"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Qual e o nome do protagonista de 'Hollow Knight'?", opcoes: ["The Knight", "Hornet", "The Hollow Knight", "The Pale King"], correta: 0, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Em 'Animal Crossing', o jogador mora em que tipo de lugar?", opcoes: ["Cidade", "Ilha", "Floresta", "Montanha"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual console usa a arquitetura 'Cell'?", opcoes: ["Xbox 360", "PlayStation 3", "Wii", "Dreamcast"], correta: 1, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Estudio criador de 'Dark Souls'?", opcoes: ["FromSoftware", "Platinum Games", "Team Ninja", "Capcom"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Jogo mais famoso do genero 'Battle Royale' atualmente?", opcoes: ["PUBG", "Fortnite", "Apex Legends", "Warzone"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Em 'Metal Gear Solid', qual o nome do protagonista?", opcoes: ["Solid Snake", "Big Boss", "Raiden", "Liquid Snake"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual e o nome do mascote da Sega?", opcoes: ["Mario", "Sonic", "Crash", "Spyro"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Jogo 'The Sims' e um simulador de?", opcoes: ["Vida", "Construcao", "Fazenda", "Cidade"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Em 'League of Legends', quantos jogadores por time?", opcoes: ["3", "4", "5", "6"], correta: 2, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual empresa criou o console 'PlayStation'?", opcoes: ["Microsoft", "Nintendo", "Sony", "Sega"], correta: 2, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Em 'BioShock', qual e o nome da cidade subaquatica?", opcoes: ["Rapture", "Columbia", "Silent Hill", "Arkham"], correta: 0, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Nome do protagonista de 'God of War'?", opcoes: ["Zeus", "Kratos", "Ares", "Atreus"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual jogo introduziu o personagem 'Master Chief'?", opcoes: ["Halo: Combat Evolved", "Halo 2", "Halo 3", "Halo: Reach"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Tom Nook e um personagem de qual franquia?", opcoes: ["Animal Crossing", "Pokemon", "Stardew Valley", "Harvest Moon"], correta: 0, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Em 'Portal', qual a cor do portal de entrada?", opcoes: ["Azul", "Laranja", "Verde", "Roxo"], correta: 0, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Jogo eletronico mais caro ja produzido?", opcoes: ["GTA V", "Cyberpunk 2077", "Star Citizen", "Red Dead Redemption 2"], correta: 2, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Qual era o nome do primeiro videogame domestico?", opcoes: ["Atari 2600", "Magnavox Odyssey", "ColecoVision", "Intellivision"], correta: 1, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Qual jogo popularizou o termo 'Battle Pass'?", opcoes: ["Fortnite", "Dota 2", "Apex Legends", "Call of Duty"], correta: 0, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Em qual cidade se passa 'Cyberpunk 2077'?", opcoes: ["Night City", "Los Santos", "Neo Tokyo", "Rapture"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Serie 'Dark Souls' e conhecida por ser:", opcoes: ["Dificil", "Facil", "Curta", "Infantil"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual a nacionalidade do protagonista de 'Ghost of Tsushima'?", opcoes: ["Chines", "Coreano", "Japones", "Mongol"], correta: 2, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Em 'Horizon Zero Dawn', a protagonista se chama:", opcoes: ["Aloy", "Lara", "Ellie", "Senua"], correta: 0, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Qual foi o primeiro jogo da serie 'Resident Evil'?", opcoes: ["Resident Evil 0", "Resident Evil 1", "Resident Evil 2", "Resident Evil Code Veronica"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Em 'The Legend of Zelda: Ocarina of Time', quantos templos principais existem?", opcoes: ["5", "6", "7", "8"], correta: 2, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Qual empresa desenvolveu 'Celeste'?", opcoes: ["Team Cherry", "Matt Makes Games", "Supergiant", "Red Hook"], correta: 1, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Qual e o nome do protagonista de 'Persona 4'?", opcoes: ["Yu Narukami", "Ren Amamiya", "Makoto Yuki", "Tatsuya Suou"], correta: 0, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Em 'Undertale', qual e o nome do boss final da rota genocide?", opcoes: ["Asgore", "Sans", "Flowey", "Toriel"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Qual jogo popularizou o termo 'Soulslike'?", opcoes: ["Elden Ring", "Dark Souls", "Demon's Souls", "Bloodborne"], correta: 2, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Em que ano foi lancado 'Super Mario 64'?", opcoes: ["1995", "1996", "1997", "1998"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Qual personagem nao e jogavel em 'Super Smash Bros. Ultimate'?", opcoes: ["Sora", "Goku", "Banjo", "Steve"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual empresa criou 'Minecraft'?", opcoes: ["Microsoft", "Mojang", "Epic Games", "Valve"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Em qual jogo aparece a frase 'The cake is a lie'?", opcoes: ["Portal", "Half-Life", "Team Fortress", "Left 4 Dead"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual e o nome do protagonista de 'Chrono Trigger'?", opcoes: ["Crono", "Lucca", "Frog", "Magus"], correta: 0, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Quem e o antagonista principal de 'Final Fantasy VII'?", opcoes: ["Sephiroth", "Kefka", "Cloud", "Zack"], correta: 0, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Quantos mundos existem em 'Super Mario World'?", opcoes: ["6", "7", "8", "9"], correta: 2, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Em 'Street Fighter II', qual golpe especial de Ryu e o 'Hadouken'?", opcoes: ["Chute voador", "Projetil de fogo", "Golpe de cotovelo", "Soco carregado"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Qual jogo apresenta o sistema de 'Nemesis'?", opcoes: ["Shadow of Mordor", "Assassin's Creed", "Far Cry", "The Witcher"], correta: 0, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Qual console da Nintendo foi o primeiro a ter tela touch?", opcoes: ["Wii U", "Nintendo DS", "Switch", "3DS"], correta: 1, cat: 'games', dificuldade: 'facil' },
    { pergunta: "Em qual jogo você controla um 'Paleblood' caçador?", opcoes: ["Dark Souls", "Bloodborne", "Sekiro", "Elden Ring"], correta: 1, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Qual foi o jogo mais vendido do PlayStation 2?", opcoes: ["GTA San Andreas", "GTA Vice City", "Final Fantasy X", "Gran Turismo 3"], correta: 0, cat: 'games', dificuldade: 'dificil' },
    { pergunta: "Em 'Mario Kart', qual item permite ao jogador teletransportar para a frente?", opcoes: ["Estrela", "Cogumelo", "Raio", "Casca azul"], correta: 0, cat: 'games', dificuldade: 'medio' },
    { pergunta: "Qual e o nome do protagonista de 'Metroid'?", opcoes: ["Samus Aran", "Ridley", "Mother Brain", "Kraid"], correta: 0, cat: 'games', dificuldade: 'facil' },
];

// ===== PERGUNTAS - FILMES =====
const perguntasFilmes = [
    { pergunta: "Ator do Coringa em 'O Cavaleiro das Trevas' (2008)?", opcoes: ["Phoenix", "Nicholson", "Heath Ledger", "Leto"], correta: 2, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Pilulas que Morpheus oferece em 'Matrix'?", opcoes: ["Azul e Vermelha", "Vermelha e Azul", "Verde e Azul", "Preta e Branca"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Robo protagonista de 'Wall-E'?", opcoes: ["EVE", "Wall-E", "M-O", "AUTO"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Quem empunha o Mjolnir em 'Vingadores: Ultimato'?", opcoes: ["Thor", "Capitao America", "Homem de Ferro", "Hulk"], correta: 1, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Primeiro filme da Pixar?", opcoes: ["Nemo", "Monstros S.A.", "Toy Story", "Os Incriveis"], correta: 2, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Robo de Cooper em 'Interestelar'?", opcoes: ["TARS", "CASE", "KIPP", "HAL"], correta: 0, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Ator que interpretou Wolverine nos X-Men?", opcoes: ["Ryan Reynolds", "Hugh Jackman", "Patrick Stewart", "James Marsden"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Velocidade para viajar no tempo em 'De Volta para o Futuro'?", opcoes: ["60 mph", "88 mph", "100 mph", "120 mph"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Filme da Disney com o personagem 'Mufasa'?", opcoes: ["O Rei Leao", "Branca de Neve", "Aladdin", "A Bela e a Fera"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Cacador de recompensas mais famoso de 'Star Wars'?", opcoes: ["Jango Fett", "Boba Fett", "Din Djarin", "Cad Bane"], correta: 1, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Filme que tornou Keanu Reeves conhecido como 'John Wick'?", opcoes: ["Speed", "Matrix", "John Wick", "Point Break"], correta: 2, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Dinossauro protagonista de 'Jurassic Park'?", opcoes: ["T-Rex", "Velociraptor", "Brachiosaurus", "Triceratops"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Portador do Um Anel em 'O Senhor dos Aneis'?", opcoes: ["Gandalf", "Aragorn", "Frodo", "Legolas"], correta: 2, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Animacao da Pixar com o rato Remy?", opcoes: ["Ratatouille", "Up", "Divertida Mente", "Toy Story 3"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Casas de Hogwarts em 'Harry Potter'?", opcoes: ["3", "4", "5", "6"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Ditador de 'Mad Max: Estrada da Furia'?", opcoes: ["Immortan Joe", "Rictus", "The Bullet Farmer", "The People Eater"], correta: 0, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Diretor de 'Clube da Luta'?", opcoes: ["Christopher Nolan", "David Fincher", "Quentin Tarantino", "Ridley Scott"], correta: 1, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Modelo do exterminador que protege John Connor em 'O Exterminador do Futuro 2'?", opcoes: ["T-800", "T-1000", "TX", "T-850"], correta: 0, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Animacao da Disney sobre o Dia dos Mortos?", opcoes: ["Viva: A Vida e uma Festa", "Frozen", "Moana", "Encanto"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Ator que interpretou o agente K em 'Blade Runner 2049'?", opcoes: ["Harrison Ford", "Ryan Gosling", "Jared Leto", "Dave Bautista"], correta: 1, cat: 'filmes', dificuldade: 'dificil' },
    { pergunta: "Dragao de Soluco em 'Como Treinar Seu Dragao'?", opcoes: ["Furia da Noite", "Banguela", "Furia Mortal", "Furia Celestial"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Planeta deserto em 'Duna' (2021)?", opcoes: ["Caladan", "Arrakis", "Giedi Prime", "Salusa Secundus"], correta: 1, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Atriz que interpretou a Mulher-Maravilha?", opcoes: ["Scarlett Johansson", "Gal Gadot", "Margot Robbie", "Brie Larson"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Primeira aparicao do Pantera Negra no MCU?", opcoes: ["Pantera Negra", "Guerra Civil", "Era de Ultron", "Homem de Ferro 2"], correta: 1, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Filme de maior bilheteria da historia (sem correcao)?", opcoes: ["Vingadores: Ultimato", "Avatar", "Titanic", "Star Wars: O Despertar da Forca"], correta: 1, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Nome do T-Rex em 'Jurassic Park'?", opcoes: ["Rexy", "Rex", "Tyrant", "Raptor"], correta: 0, cat: 'filmes', dificuldade: 'dificil' },
    { pergunta: "Qual filme ganhou o Oscar de Melhor Filme em 2020?", opcoes: ["1917", "Parasita", "Coringa", "Era Uma Vez em Hollywood"], correta: 1, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Diretor de 'Interestelar' e 'A Origem'?", opcoes: ["Nolan", "Villeneuve", "Fincher", "Spielberg"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Ator principal de 'Gladiador' (2000)?", opcoes: ["Russell Crowe", "Joaquin Phoenix", "Brad Pitt", "Matt Damon"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Desenho animado com o personagem 'Bob Esponja'?", opcoes: ["Bob Esponja", "Patrick", "Lula Molusco", "Sirigueijo"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Ano de lancamento de 'Matrix'?", opcoes: ["1997", "1998", "1999", "2000"], correta: 2, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Heroi da Marvel que pode ficar invisivel?", opcoes: ["Homem Invisivel", "Susan Storm", "Mistica", "Visao"], correta: 1, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Nome verdadeiro do Darth Vader?", opcoes: ["Luke", "Anakin", "Obi-Wan", "Palpatine"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Em 'Toy Story', qual e o nome do cauboi?", opcoes: ["Woody", "Buzz", "Jessie", "Rex"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Filme onde o personagem 'Forrest Gump' aparece?", opcoes: ["Forrest Gump", "Naufrago", "Philadelphia", "O Poderoso Chefeao"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Nave espacial em 'Alien - O 8 Passageiro'?", opcoes: ["Nostromo", "Sulaco", "Prometheus", "Enterprise"], correta: 0, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Pais de origem dos filmes do 'Estudio Ghibli'?", opcoes: ["China", "Japao", "Coreia", "Tailandia"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Serie de TV zumbi mais famosa?", opcoes: ["The Walking Dead", "Z Nation", "iZombie", "Black Summer"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Qual filme tem o famoso discurso 'You Can't Handle the Truth'?", opcoes: ["Questao de Honra", "O Pavao dos Dourados", "O Advogado do Diabo", "12 Homens e uma Sentenca"], correta: 0, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Quantos filmes 'O Poderoso Chefeao' existem?", opcoes: ["1", "2", "3", "4"], correta: 2, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Qual ator interpretou Jack Sparrow em 'Piratas do Caribe'?", opcoes: ["Orlando Bloom", "Johnny Depp", "Geoffrey Rush", "Kevin McNally"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Filme vencedor do Oscar de Melhor Filme em 2023?", opcoes: ["Tudo em Todo Lugar ao Mesmo Tempo", "Os Fabelmans", "A Baleia", "Top Gun: Maverick"], correta: 0, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Qual o nome do dinossauro em 'Jurassic Park' que cuspe veneno?", opcoes: ["Dilophosaurus", "Velociraptor", "Spinosaurus", "T-Rex"], correta: 0, cat: 'filmes', dificuldade: 'dificil' },
    { pergunta: "Ator que interpretou o Charada em 'The Batman' (2022)?", opcoes: ["Paul Dano", "Colin Farrell", "Jeffrey Wright", "John Turturro"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Qual e o planeta natal de Superman?", opcoes: ["Krypton", "Mars", "Venus", "Jupiter"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Em 'Clube da Luta', qual e a primeira regra?", opcoes: ["Nao falar sobre o Clube da Luta", "So vale golpe baixo", "Lutar ate o fim", "Nao desistir nunca"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Qual o nome do dragao de 'Game of Thrones' mais famoso?", opcoes: ["Drogon", "Viserion", "Rhaegal", "Balerion"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Diretor de 'Pulp Fiction'?", opcoes: ["Quentin Tarantino", "Martin Scorsese", "Steven Spielberg", "David Lynch"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Em 'O Senhor dos Aneis', quem disse 'You shall not pass!'?", opcoes: ["Gandalf", "Aragorn", "Saruman", "Elrond"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Qual filme da Disney apresenta o personagem 'Elsa'?", opcoes: ["Moana", "Frozen", "Encanto", "Valente"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Quantos filmes 'Velozes e Furiosos' existem (principal)?", opcoes: ["8", "9", "10", "11"], correta: 2, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Em 'O Iluminado', qual a frase famosa de Jack?", opcoes: ["Here's Johnny!", "Redrum!", "All work and no play", "Come play with us"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "A nave em 'Alien' se chama?", opcoes: ["Nostromo", "Sulaco", "Prometheus", "Covenant"], correta: 0, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Saga 'Crepusculo' e sobre?", opcoes: ["Vampiros e Lobisomens", "Zumbis", "Fadas", "Magia"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Nome do gorila gigante famoso do cinema?", opcoes: ["King Kong", "Godzilla", "Mighty Joe Young", "Donkey Kong"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "A qual familia pertence Romeo em 'Romeu e Julieta'?", opcoes: ["Montague", "Capulet", "Escalus", "Paris"], correta: 0, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Quem interpretou o Coringa em 2019?", opcoes: ["Heath Ledger", "Joaquin Phoenix", "Jared Leto", "Jack Nicholson"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Em 'Vingadores: Guerra Infinita', Thanos busca o que?", opcoes: ["Joias do Infinito", "Martelo do Thor", "Escudo do Capitao", "Armadura do Homem de Ferro"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Cidade de 'Batman'?", opcoes: ["Metropolis", "Gotham", "Star City", "Central City"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Nome do menino em 'A Vida e Bela'?", opcoes: ["Guido", "Giosue", "Joshua", "Eliseu"], correta: 1, cat: 'filmes', dificuldade: 'dificil' },
    { pergunta: "Qual ator interpretou o 'Coringa' em 2008?", opcoes: ["Joaquin Phoenix", "Jack Nicholson", "Heath Ledger", "Jared Leto"], correta: 2, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Em 'Matrix', qual e a cor da pilula que Neo escolhe?", opcoes: ["Azul", "Verde", "Vermelha", "Branca"], correta: 2, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Qual filme foi o primeiro da Marvel Studios?", opcoes: ["Homem de Ferro", "Capitão America", "Thor", "Hulk"], correta: 0, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Diretor de 'Cidade de Deus'?", opcoes: ["Fernando Meirelles", "Walter Salles", "Jose Padilha", "Hector Babenco"], correta: 0, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Qual a nacionalidade do diretor 'Almodóvar'?", opcoes: ["Mexicana", "Espanhola", "Francesa", "Italiana"], correta: 1, cat: 'filmes', dificuldade: 'dificil' },
    { pergunta: "Em 'O Senhor dos Aneis', quem e o portador do Anel em 'As Duas Torres'?", opcoes: ["Frodo", "Gandalf", "Aragorn", "Sam"], correta: 0, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Qual instrumento e usado pelo assassino em 'O Segredo dos Seus Olhos'?", opcoes: ["Faca", "Pistola", "Corda", "Machado"], correta: 2, cat: 'filmes', dificuldade: 'dificil' },
    { pergunta: "Em 'Interestelar', qual e o nome da filha de Cooper?", opcoes: ["Murph", "Laura", "Amelia", "Brand"], correta: 0, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Qual planeta em 'Star Wars' e deserto e casa de Anakin?", opcoes: ["Naboo", "Coruscant", "Tatooine", "Mustafar"], correta: 2, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Atriz que interpretou a 'Katniss Everdeen'?", opcoes: ["Emma Watson", "Jennifer Lawrence", "Shailene Woodley", "Kristen Stewart"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "O que significa 'Titanic' no filme de mesmo nome?", opcoes: ["Nome do navio", "Cidade", "Personagem", "Empresa"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Em 'Divertida Mente', quantas emocoes principais existem?", opcoes: ["4", "5", "6", "7"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Qual filme venceu o Oscar de 1995 (Melhor Filme)?", opcoes: ["Forrest Gump", "Pulp Fiction", "Clube da Luta", "Matrix"], correta: 0, cat: 'filmes', dificuldade: 'dificil' },
    { pergunta: "Quem dirigiu 'O Poderoso Chefao'?", opcoes: ["Martin Scorsese", "Francis Ford Coppola", "Steven Spielberg", "Brian De Palma"], correta: 1, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Em 'A Origem', qual objeto Cobb usa como totem?", opcoes: ["Dado", "Pião", "Moeda", "Anel"], correta: 1, cat: 'filmes', dificuldade: 'medio' },
    { pergunta: "Qual e o nome do dinossauro principal em 'Jurassic World'?", opcoes: ["Indominus Rex", "T-Rex", "Velociraptor", "Spinosaurus"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Atriz que interpretou 'Gamora' no MCU?", opcoes: ["Zoe Saldana", "Scarlett Johansson", "Natalie Portman", "Brie Larson"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Qual filme da Pixar se passa no Mexico?", opcoes: ["Viva", "Coco", "Encanto", "Moana"], correta: 1, cat: 'filmes', dificuldade: 'facil' },
    { pergunta: "Quem e o vilao de 'Pantera Negra'?", opcoes: ["Killmonger", "Thanos", "Ultron", "Loki"], correta: 0, cat: 'filmes', dificuldade: 'facil' },
];

// ===== PERGUNTAS - MATEMATICA =====
const perguntasMatematica = [
    { pergunta: "Quanto e 7 x 8?", opcoes: ["48", "56", "64", "72"], correta: 1, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e a raiz quadrada de 144?", opcoes: ["10", "11", "12", "13"], correta: 2, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Quanto e 15% de 200?", opcoes: ["25", "30", "35", "20"], correta: 1, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Qual e o valor de Pi (aproximado)?", opcoes: ["3.14", "3.16", "3.12", "3.18"], correta: 0, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Quanto e 2 elevado a 10?", opcoes: ["512", "1024", "2048", "256"], correta: 1, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Qual e o resultado de 0 dividido por qualquer numero?", opcoes: ["0", "1", "Infinito", "Indefinido"], correta: 0, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Quantos lados tem um hexagono?", opcoes: ["5", "6", "7", "8"], correta: 1, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Quanto e 1 + 2 + 3 + 4 + 5?", opcoes: ["12", "13", "14", "15"], correta: 3, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e o MMC de 4 e 6?", opcoes: ["10", "12", "14", "24"], correta: 1, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Quantos graus tem um triangulo?", opcoes: ["90", "180", "270", "360"], correta: 1, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e o logaritmo de 100 na base 10?", opcoes: ["1", "2", "10", "100"], correta: 1, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Quanto e 9 ao quadrado?", opcoes: ["72", "81", "90", "99"], correta: 1, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual o numero primo entre 10 e 20?", opcoes: ["15", "17", "19", "21"], correta: 2, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Quantos segundos tem uma hora?", opcoes: ["3600", "360", "6000", "1800"], correta: 0, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e a area de um quadrado de lado 5?", opcoes: ["20", "25", "10", "30"], correta: 1, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e o resultado de 3 + 4 x 2?", opcoes: ["14", "11", "10", "12"], correta: 1, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Quantos zeros tem um milhao?", opcoes: ["5", "6", "7", "8"], correta: 1, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e a derivada de x^2?", opcoes: ["x", "2x", "x^2", "2"], correta: 1, cat: 'matematica', dificuldade: 'dificil' },
    { pergunta: "Qual e a raiz cubica de 27?", opcoes: ["2", "3", "4", "5"], correta: 1, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Quanto e 12 x 12?", opcoes: ["124", "134", "144", "154"], correta: 2, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Quanto e 5! (5 fatorial)?", opcoes: ["60", "120", "240", "25"], correta: 1, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Qual e o menor numero natural?", opcoes: ["-1", "0", "1", "2"], correta: 1, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e o MDC de 12 e 18?", opcoes: ["3", "4", "6", "9"], correta: 2, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Em uma PA de razao 3, se o primeiro termo e 2, qual e o quinto termo?", opcoes: ["11", "14", "17", "20"], correta: 1, cat: 'matematica', dificuldade: 'dificil' },
    { pergunta: "Quantos lados tem um dodecagono?", opcoes: ["10", "11", "12", "13"], correta: 2, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Qual o valor de x em 2x + 5 = 13?", opcoes: ["2", "3", "4", "5"], correta: 2, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Quanto e 25% de 80?", opcoes: ["15", "20", "25", "30"], correta: 1, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Quanto e 50 x 50?", opcoes: ["2000", "2250", "2500", "2750"], correta: 2, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Em um dado comum, quantas faces tem?", opcoes: ["4", "6", "8", "12"], correta: 1, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e o volume de um cubo de aresta 3?", opcoes: ["9", "18", "27", "36"], correta: 2, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "O que e um numero primo?", opcoes: ["Divisivel por 1 e ele mesmo", "Divisivel por 2", "Termina em 0", "Multiplo de 3"], correta: 0, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e a formula da area de um circulo?", opcoes: ["2πr", "πr^2", "πd", "2πd"], correta: 1, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Quantos dias tem um ano bissexto?", opcoes: ["364", "365", "366", "367"], correta: 2, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e a raiz quadrada de 169?", opcoes: ["12", "13", "14", "11"], correta: 1, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Em porcentagem, 1/4 equivale a?", opcoes: ["15%", "20%", "25%", "30%"], correta: 2, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e o resultado de 8 / 2(2+2)?", opcoes: ["1", "16", "8", "4"], correta: 1, cat: 'matematica', dificuldade: 'dificil' },
    { pergunta: "Quantos numeros naturais existem?", opcoes: ["100", "1000", "Infinitos", "1 milhao"], correta: 2, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Quanto e 3 elevado a 4?", opcoes: ["27", "81", "64", "243"], correta: 1, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Qual e a area de um triangulo com base 10 e altura 6?", opcoes: ["30", "60", "16", "40"], correta: 0, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Quanto e 25 x 25?", opcoes: ["525", "625", "725", "425"], correta: 1, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Quantos lados tem um octogono?", opcoes: ["6", "7", "8", "9"], correta: 2, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e o valor de 0.5 + 0.25?", opcoes: ["0.75", "0.50", "1.0", "0.25"], correta: 0, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "O que e um numero inteiro?", opcoes: ["Numero com virgula", "Numero sem virgula", "Numero primo", "Numero par"], correta: 1, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Quanto e 12 x 15?", opcoes: ["150", "160", "170", "180"], correta: 3, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e a raiz quadrada de 225?", opcoes: ["13", "14", "15", "16"], correta: 2, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Quantos graus tem um angulo reto?", opcoes: ["45", "90", "180", "360"], correta: 1, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e a media de 7, 8 e 9?", opcoes: ["7", "8", "9", "10"], correta: 1, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Quanto e 2/5 em decimal?", opcoes: ["0.2", "0.25", "0.4", "0.5"], correta: 2, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Qual e o MDC de 24 e 36?", opcoes: ["6", "8", "12", "18"], correta: 2, cat: 'matematica', dificuldade: 'medio' },
    { pergunta: "Quanto e 100 - 37?", opcoes: ["63", "67", "73", "77"], correta: 0, cat: 'matematica', dificuldade: 'facil' },
    { pergunta: "Qual e o resultado de 15 + 8 x 2?", opcoes: ["46", "23", "31", "38"], correta: 2, cat: 'matematica', dificuldade: 'medio' },
];

// ===== PERGUNTAS - GEOGRAFIA =====
const perguntasGeografia = [
    { pergunta: "Qual e a capital do Brasil?", opcoes: ["Rio de Janeiro", "Sao Paulo", "Brasilia", "Salvador"], correta: 2, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual e o maior oceano do mundo?", opcoes: ["Atlantico", "Indico", "Pacifico", "Artico"], correta: 2, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Quantos continentes existem?", opcoes: ["5", "6", "7", "8"], correta: 2, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual e o pais mais populoso do mundo?", opcoes: ["EUA", "India", "China", "Indonesia"], correta: 1, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "Qual a capital da Franca?", opcoes: ["Londres", "Paris", "Berlim", "Madri"], correta: 1, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Em qual continente fica o Egito?", opcoes: ["Europa", "Asia", "Africa", "America"], correta: 2, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual e o maior pais do mundo em area?", opcoes: ["China", "Canada", "Russia", "EUA"], correta: 2, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual rio e o mais longo do mundo?", opcoes: ["Amazonas", "Nilo", "Mississippi", "Yangtze"], correta: 1, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "Qual a capital do Japao?", opcoes: ["Quioto", "Toquio", "Osaka", "Yokohama"], correta: 1, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual deserto e o maior do mundo?", opcoes: ["Saara", "Gobi", "Antartida", "Kalahari"], correta: 2, cat: 'geografia', dificuldade: 'dificil' },
    { pergunta: "Qual a capital da Argentina?", opcoes: ["Santiago", "Buenos Aires", "Lima", "Bogota"], correta: 1, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual e o menor pais do mundo?", opcoes: ["Monaco", "Vaticano", "San Marino", "Liechtenstein"], correta: 1, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "A Cordilheira dos Andes fica em qual continente?", opcoes: ["Europa", "Asia", "Africa", "America do Sul"], correta: 3, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual e a capital da Australia?", opcoes: ["Sydney", "Melbourne", "Canberra", "Brisbane"], correta: 2, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "Qual oceano banha a costa brasileira?", opcoes: ["Pacifico", "Atlantico", "Indico", "Artico"], correta: 1, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Em qual pais fica o Monte Everest?", opcoes: ["India", "Nepal", "China", "Paquistao"], correta: 1, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "Qual e a capital de Portugal?", opcoes: ["Porto", "Lisboa", "Braga", "Coimbra"], correta: 1, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual e a maior floresta tropical do mundo?", opcoes: ["Congo", "Amazonia", "Borneo", "Daintree"], correta: 1, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual a capital do Canada?", opcoes: ["Toronto", "Vancouver", "Ottawa", "Montreal"], correta: 2, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "Alemanha fica em qual continente?", opcoes: ["Asia", "Europa", "America", "Africa"], correta: 1, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual pais tem o formato de uma bota?", opcoes: ["Espanha", "Grecia", "Italia", "Portugal"], correta: 2, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Cidade conhecida como 'Cidade Luz'?", opcoes: ["Roma", "Paris", "Londres", "Nova York"], correta: 1, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual a capital da Russia?", opcoes: ["Sao Petersburgo", "Moscou", "Vladivostok", "Kiev"], correta: 1, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Pais que ocupa a maior parte da Peninsula Iberica?", opcoes: ["Portugal", "Espanha", "Franca", "Andorra"], correta: 1, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "Cordilheira mais longa do mundo?", opcoes: ["Himalaia", "Andes", "Alpes", "Montanhas Rochosas"], correta: 1, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "Qual a capital do Mexico?", opcoes: ["Cancun", "Guadalajara", "Cidade do Mexico", "Monterrey"], correta: 2, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Quantos fusos horarios tem o Brasil?", opcoes: ["2", "3", "4", "5"], correta: 2, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "Qual pais e conhecido como 'Terra do Sol Nascente'?", opcoes: ["Coreia", "China", "Japao", "Tailandia"], correta: 2, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual e o ponto mais alto do Brasil?", opcoes: ["Pico da Neblina", "Pico da Bandeira", "Monte Roraima", "Pico Paranagua"], correta: 0, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "Mar Mediterraneo separa quais continentes?", opcoes: ["Europa e Asia", "Europa e Africa", "Africa e Asia", "America e Europa"], correta: 1, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual e a capital da Irlanda?", opcoes: ["Belfast", "Dublin", "Cork", "Galway"], correta: 1, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "Qual pais tem a maior populacao do mundo?", opcoes: ["China", "India", "EUA", "Indonesia"], correta: 1, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Em que continente fica o deserto do Saara?", opcoes: ["Asia", "Africa", "America do Sul", "Australia"], correta: 1, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual e o rio mais extenso do Brasil?", opcoes: ["Amazonas", "Sao Francisco", "Parana", "Tocantins"], correta: 0, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual e a capital da Escocia?", opcoes: ["Glasgow", "Edimburgo", "Londres", "Cardiff"], correta: 1, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "Quantos paises existem na America do Sul?", opcoes: ["10", "11", "12", "13"], correta: 2, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "Qual e o maior lago da Africa?", opcoes: ["Victoria", "Tanganica", "Malawi", "Chade"], correta: 0, cat: 'geografia', dificuldade: 'dificil' },
    { pergunta: "Qual oceano esta ao norte do Canada?", opcoes: ["Atlantico", "Pacifico", "Artico", "Indico"], correta: 2, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Qual e a capital da Colombia?", opcoes: ["Bogota", "Lima", "Quito", "Caracas"], correta: 0, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "Em qual pais fica a sede do Monte Everest?", opcoes: ["India", "Nepal", "Tibet", "China"], correta: 1, cat: 'geografia', dificuldade: 'medio' },
    { pergunta: "Qual e a menor ilha habitada do mundo?", opcoes: ["Just Room Enough", "Maldivas", "Bermudas", "Fernando de Noronha"], correta: 0, cat: 'geografia', dificuldade: 'dificil' },
    { pergunta: "Qual e o pais com mais fusos horarios?", opcoes: ["Russia", "EUA", "Franca", "China"], correta: 2, cat: 'geografia', dificuldade: 'dificil' },
    { pergunta: "Qual deserto e o maior fora das regiões polares?", opcoes: ["Gobi", "Atacama", "Saara", "Kalahari"], correta: 2, cat: 'geografia', dificuldade: 'facil' },
    { pergunta: "O Mar Caspio e na verdade um?", opcoes: ["Oceano", "Lago", "Rio", "Golfo"], correta: 1, cat: 'geografia', dificuldade: 'medio' },
];

// ===== PERGUNTAS - CIENCIAS =====
const perguntasCiencias = [
    { pergunta: "Qual e o simbolo quimico da agua?", opcoes: ["H2O", "CO2", "NaCl", "O2"], correta: 0, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Quantos ossos tem o corpo humano adulto?", opcoes: ["196", "206", "216", "226"], correta: 1, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Qual planeta e conhecido como 'Planeta Vermelho'?", opcoes: ["Venus", "Marte", "Jupiter", "Saturno"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Qual o maior orgao do corpo humano?", opcoes: ["Figado", "Coracao", "Pele", "Cerebro"], correta: 2, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Qual e o elemento mais abundante no universo?", opcoes: ["Oxigenio", "Hidrogenio", "Carbono", "Helio"], correta: 1, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "O que as plantas produzem na fotossintese?", opcoes: ["CO2", "Oxigenio", "Nitrogenio", "Hidrogenio"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Qual a velocidade da luz (aproximada)?", opcoes: ["300.000 km/s", "150.000 km/s", "500.000 km/s", "100.000 km/s"], correta: 0, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Qual e a unidade basica da vida?", opcoes: ["Atomo", "Celula", "DNA", "Proteina"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Quantos planetas tem o sistema solar?", opcoes: ["7", "8", "9", "10"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Qual e a formula quimica do dioxido de carbono?", opcoes: ["CO", "CO2", "C2O", "C2O2"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "O DNA tem formato de?", opcoes: ["Helice dupla", "Circulo", "Triangulo", "Linha reta"], correta: 0, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Qual o ph da agua pura?", opcoes: ["5", "6", "7", "8"], correta: 2, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Qual animal e o mais rapido do mundo?", opcoes: ["Guepardo", "Falcao peregrino", "Cavalo", "Gazela"], correta: 1, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Quanto tempo a luz do Sol leva para chegar a Terra?", opcoes: ["8 minutos", "15 minutos", "1 hora", "5 minutos"], correta: 0, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Qual cientista propos a teoria da relatividade?", opcoes: ["Newton", "Einstein", "Galileu", "Darwin"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Quantos dentes tem um adulto normal?", opcoes: ["28", "30", "32", "34"], correta: 2, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "O que a hemoglobina transporta no sangue?", opcoes: ["CO2", "Oxigenio", "Nutrientes", "Hormonios"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Qual e o maior planeta do sistema solar?", opcoes: ["Saturno", "Jupiter", "Netuno", "Urano"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Quantos cromossomos tem o ser humano?", opcoes: ["23", "44", "46", "48"], correta: 2, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Agua ferve a quantos graus Celsius?", opcoes: ["90", "100", "110", "120"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Qual e o menor osso do corpo humano?", opcoes: ["Falange", "Estribo", "Martelo", "Bigorna"], correta: 1, cat: 'ciencias', dificuldade: 'dificil' },
    { pergunta: "Baleias sao:", opcoes: ["Peixes", "Mamiferos", "Repteis", "Anfibios"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Qual vitamina e produzida pela exposicao ao sol?", opcoes: ["Vitamina A", "Vitamina B", "Vitamina C", "Vitamina D"], correta: 3, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Qual e o segundo planeta mais proximo do Sol?", opcoes: ["Mercurio", "Venus", "Terra", "Marte"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "O DNA fica localizado onde na celula?", opcoes: ["Membrana", "Citoplasma", "Nucleo", "Ribossomo"], correta: 2, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "O que sao virus?", opcoes: ["Celulas", "Parasitas intracelulares", "Bacterias", "Fungos"], correta: 1, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Quantos litros de sangue o corpo humano adulto tem?", opcoes: ["2-3", "4-6", "7-9", "10-12"], correta: 1, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Qual e a formula da forca (segunda lei de Newton)?", opcoes: ["F = m/v", "F = m * a", "F = m * v", "F = a / m"], correta: 1, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Qual cientista criou a teoria da evolucao?", opcoes: ["Lamarck", "Darwin", "Mendel", "Wallace"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "O coracao humano tem quantas camaras?", opcoes: ["2", "3", "4", "5"], correta: 2, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Qual e a temperatura do nucleo da Terra?", opcoes: ["Cerca de 3000°C", "Cerca de 5500°C", "Cerca de 8000°C", "Cerca de 10000°C"], correta: 1, cat: 'ciencias', dificuldade: 'dificil' },
    { pergunta: "Qual vitamina e essencial para a coagulacao do sangue?", opcoes: ["Vitamina A", "Vitamina C", "Vitamina K", "Vitamina E"], correta: 2, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Qual e o elemento quimico mais pesado natural?", opcoes: ["Uranio", "Plutonio", "Ouro", "Chumbo"], correta: 0, cat: 'ciencias', dificuldade: 'dificil' },
    { pergunta: "Quantos ossos tem o cranio humano?", opcoes: ["18", "22", "26", "30"], correta: 1, cat: 'ciencias', dificuldade: 'dificil' },
    { pergunta: "Qual organela e responsavel pela producao de energia na celula?", opcoes: ["Nucleo", "Mitocondria", "Ribossomo", "Complexo de Golgi"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Qual gas e o principal componente da atmosfera terrestre?", opcoes: ["Oxigenio", "Hidrogenio", "Nitrogenio", "Dioxido de Carbono"], correta: 2, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Qual e a unidade de medida da corrente eletrica?", opcoes: ["Volt", "Ampere", "Watt", "Ohm"], correta: 1, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Quantos cromossomos tem uma celula humana normal?", opcoes: ["23", "44", "46", "48"], correta: 2, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Qual e o pH do suco gastrico?", opcoes: ["Neutro (7)", "Alcalino (9)", "Acido (2)", "Levemente acido (6)"], correta: 2, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Qual animal e conhecido como 'o engenheiro do ecossistema'?", opcoes: ["Castor", "Formiga", "Abelha", "Lobo"], correta: 0, cat: 'ciencias', dificuldade: 'dificil' },
    { pergunta: "Qual osso e o maior do corpo humano?", opcoes: ["Tibia", "Femur", "Umero", "Radio"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "O que sao antibioticos?", opcoes: ["Vitaminas", "Medicamentos contra bacterias", "Analgesicos", "Anti-inflamatorios"], correta: 1, cat: 'ciencias', dificuldade: 'facil' },
    { pergunta: "Quantos elementos quimicos existem na tabela periodica natural?", opcoes: ["92", "100", "118", "120"], correta: 0, cat: 'ciencias', dificuldade: 'dificil' },
    { pergunta: "Qual planeta tem o maior numero de luas?", opcoes: ["Jupiter", "Saturno", "Urano", "Netuno"], correta: 1, cat: 'ciencias', dificuldade: 'medio' },
    { pergunta: "Qual e a funcao da insulina no corpo?", opcoes: ["Regular acucar no sangue", "Digestao", "Producao de energia", "Fortalecer ossos"], correta: 0, cat: 'ciencias', dificuldade: 'medio' },
];

// ===== PERGUNTAS - HISTORIA =====
const perguntasHistoria = [
    { pergunta: "Em que ano o Brasil foi descoberto?", opcoes: ["1498", "1500", "1502", "1492"], correta: 1, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Quem foi o primeiro presidente do Brasil?", opcoes: ["Getulio Vargas", "Deodoro da Fonseca", "Dom Pedro I", "Prudente de Morais"], correta: 1, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "Em que ano terminou a Segunda Guerra Mundial?", opcoes: ["1943", "1944", "1945", "1946"], correta: 2, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Quem pintou a Mona Lisa?", opcoes: ["Michelangelo", "Leonardo da Vinci", "Rafael", "Donatello"], correta: 1, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Em que ano o homem pisou na Lua pela primeira vez?", opcoes: ["1967", "1968", "1969", "1970"], correta: 2, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Quem foi o primeiro imperador do Brasil?", opcoes: ["Dom Joao VI", "Dom Pedro I", "Dom Pedro II", "Dom Miguel"], correta: 1, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "Queda do Muro de Berlim ocorreu em que ano?", opcoes: ["1987", "1988", "1989", "1990"], correta: 2, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "Quem foi o principal lider da independencia da India?", opcoes: ["Gandhi", "Nehru", "Tilak", "Bose"], correta: 0, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "A Revolucao Francesa comecou em que ano?", opcoes: ["1776", "1789", "1799", "1804"], correta: 1, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "Quem descobriu a America em 1492?", opcoes: ["Vasco da Gama", "Pedro Alvares Cabral", "Cristovao Colombo", "Fernao de Magalhaes"], correta: 2, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Imperio Romano do Ocidente caiu em que ano?", opcoes: ["376", "476", "576", "676"], correta: 1, cat: 'historia', dificuldade: 'dificil' },
    { pergunta: "Qual guerra foi travada entre 1914 e 1918?", opcoes: ["Guerra Fria", "Primeira Guerra Mundial", "Segunda Guerra Mundial", "Guerra do Vietnam"], correta: 1, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "O Titanic afundou em qual ano?", opcoes: ["1910", "1911", "1912", "1913"], correta: 2, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Quem foi o primeiro homem a viajar ao espaco?", opcoes: ["Neil Armstrong", "Yuri Gagarin", "Buzz Aldrin", "John Glenn"], correta: 1, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "Qual pais foi o primeiro a dar direito de voto as mulheres?", opcoes: ["EUA", "Reino Unido", "Nova Zelandia", "Franca"], correta: 2, cat: 'historia', dificuldade: 'dificil' },
    { pergunta: "Em que ano o Brasil se tornou uma republica?", opcoes: ["1888", "1889", "1890", "1891"], correta: 1, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "A Guerra Fria foi um conflito entre quais paises?", opcoes: ["EUA e China", "EUA e URSS", "Russia e Alemanha", "Reino Unido e Franca"], correta: 1, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Quem foi o farao mais conhecido do Egito?", opcoes: ["Tutancamon", "Ramsés II", "Cleopatra", "Akhenaton"], correta: 0, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Qual batalha foi decisiva para a independencia do Brasil?", opcoes: ["Batalha de Guararapes", "Grito do Ipiranga", "Batalha do Jenipapo", "Batalha de Pirajá"], correta: 1, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "Tratado que dividiu o mundo entre Portugal e Espanha?", opcoes: ["Tratado de Paris", "Tratado de Tordesilhas", "Tratado de Versalhes", "Tratado de Madri"], correta: 1, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "Quem foi o presidente do Brasil durante a Segunda Guerra?", opcoes: ["Getulio Vargas", "Eurico Gaspar Dutra", "Washington Luis", "Julio Prestes"], correta: 0, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "O que foi o 'Apartheid' na Africa do Sul?", opcoes: ["Regime de segregacao racial", "Guerra civil", "Movimento de independencia", "Tratado de paz"], correta: 0, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "O Muro de Berlim separava quais Alemanhas?", opcoes: ["Alemanha Ocidental e Oriental", "Alemanha do Norte e Sul", "Alemanha e Franca", "Alemanha e Polonia"], correta: 0, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Quem foi Napoleao Bonaparte?", opcoes: ["Rei da Franca", "Lider militar e imperador frances", "Papa", "Cientista frances"], correta: 1, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Em que ano a escravidao foi abolida no Brasil?", opcoes: ["1886", "1888", "1890", "1892"], correta: 1, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Povo que construiu Machu Picchu?", opcoes: ["Maias", "Astecas", "Incas", "Tupi-Guarani"], correta: 2, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Quem foi o primeiro presidente dos EUA?", opcoes: ["Thomas Jefferson", "George Washington", "Abraham Lincoln", "John Adams"], correta: 1, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Ano da queda do Imperio Romano do Ocidente?", opcoes: ["376", "476", "576", "676"], correta: 1, cat: 'historia', dificuldade: 'dificil' },
    { pergunta: "Quem foi o ultimo imperador do Brasil?", opcoes: ["Dom Pedro I", "Dom Pedro II", "Dom Joao VI", "Dom Miguel"], correta: 1, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "Em que ano as mulheres conquistaram o direito ao voto no Brasil?", opcoes: ["1928", "1932", "1934", "1940"], correta: 1, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "Qual guerra durou 100 anos?", opcoes: ["Guerra dos Cem Anos", "Guerra dos Trinta Anos", "Guerra das Rosas", "Guerra Fria"], correta: 0, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Quem foi o primeiro europeu a chegar ao Brasil?", opcoes: ["Cristovao Colombo", "Pedro Alvares Cabral", "Amerigo Vespucci", "Vasco da Gama"], correta: 1, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "Qual farao construiu a Grande Piramide de Giza?", opcoes: ["Ramsés II", "Tutancamon", "Queops", "Akhenaton"], correta: 2, cat: 'historia', dificuldade: 'dificil' },
    { pergunta: "Em que ano a Bastilha foi tomada?", opcoes: ["1776", "1789", "1799", "1804"], correta: 1, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "Quem descobriu a penicilina?", opcoes: ["Louis Pasteur", "Alexander Fleming", "Marie Curie", "Robert Koch"], correta: 1, cat: 'historia', dificuldade: 'facil' },
    { pergunta: "O que foi a 'Inconfidencia Mineira'?", opcoes: ["Revolta pela independencia", "Revolta contra impostos", "Guerra civil", "Tratado de paz"], correta: 1, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "Quem foi o primeiro presidente eleito do Brasil?", opcoes: ["Deodoro da Fonseca", "Prudente de Morais", "Campos Salles", "Getulio Vargas"], correta: 0, cat: 'historia', dificuldade: 'dificil' },
    { pergunta: "Em que ano ocorreu o 'Massacre da Praça da Paz Celestial'?", opcoes: ["1986", "1987", "1988", "1989"], correta: 3, cat: 'historia', dificuldade: 'dificil' },
    { pergunta: "Qual pais foi o primeiro a reconhecer a independencia do Brasil?", opcoes: ["Portugal", "Inglaterra", "EUA", "Franca"], correta: 2, cat: 'historia', dificuldade: 'dificil' },
    { pergunta: "Tratado que encerrou a Primeira Guerra Mundial?", opcoes: ["Tratado de Paris", "Tratado de Versalhes", "Tratado de Tordesilhas", "Tratado de Viena"], correta: 1, cat: 'historia', dificuldade: 'medio' },
    { pergunta: "Onde foi assinada a independencia do Brasil?", opcoes: ["Rio de Janeiro", "Sao Paulo", "Minas Gerais", "Bahia"], correta: 1, cat: 'historia', dificuldade: 'facil' },
];

// ===== PERGUNTAS - ESPORTES =====
const perguntasEsportes = [
    { pergunta: "Qual pais tem mais titulos de Copa do Mundo de Futebol?", opcoes: ["Alemanha", "Italia", "Brasil", "Argentina"], correta: 2, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Quantos jogadores tem um time de futebol?", opcoes: ["7", "9", "11", "13"], correta: 2, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Em que esporte LeBron James se destacou?", opcoes: ["Futebol", "Basquete", "Basebol", "Futebol Americano"], correta: 1, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Qual pais sediou as Olimpiadas de 2016?", opcoes: ["Reino Unido", "China", "Brasil", "Russia"], correta: 2, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Qual e o esporte mais popular do mundo?", opcoes: ["Futebol", "Basquete", "Criquete", "Tênis"], correta: 0, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Onde foi realizada a primeira Copa do Mundo de Futebol?", opcoes: ["Brasil", "Uruguai", "Italia", "Franca"], correta: 1, cat: 'esportes', dificuldade: 'medio' },
    { pergunta: "Qual jogador detem o recorde de mais gols em Copas do Mundo?", opcoes: ["Messi", "Cristiano Ronaldo", "Klose", "Pelé"], correta: 2, cat: 'esportes', dificuldade: 'medio' },
    { pergunta: "Em qual esporte se usa uma raquete e uma peteca?", opcoes: ["Tênis", "Badminton", "Squash", "Volei"], correta: 1, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Qual pais tem o maior numero de medalhas olimpicas da historia?", opcoes: ["China", "Russia", "EUA", "Alemanha"], correta: 2, cat: 'esportes', dificuldade: 'medio' },
    { pergunta: "Quantas substituicoes sao permitidas no futebol profissional?", opcoes: ["2", "3", "4", "5"], correta: 3, cat: 'esportes', dificuldade: 'medio' },
    { pergunta: "Qual tenista tem mais titulos de Grand Slam?", opcoes: ["Federer", "Nadal", "Djokovic", "Sampras"], correta: 2, cat: 'esportes', dificuldade: 'medio' },
    { pergunta: "O UFC e um evento de qual esporte?", opcoes: ["Boxe", "MMA", "Kickboxing", "Jiu-Jitsu"], correta: 1, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Qual cor e a camisa do lider do Tour de France?", opcoes: ["Azul", "Verde", "Amarela", "Vermelha"], correta: 2, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Quantos pontos vale uma cesta de tres no basquete?", opcoes: ["1", "2", "3", "4"], correta: 2, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Em que ano o Brasil ganhou a primeira Copa do Mundo?", opcoes: ["1954", "1958", "1962", "1970"], correta: 1, cat: 'esportes', dificuldade: 'medio' },
    { pergunta: "Qual pais ganhou a Copa do Mundo de 2018?", opcoes: ["Alemanha", "Brasil", "Franca", "Argentina"], correta: 2, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Qual jogador de futebol tem mais Bolas de Ouro?", opcoes: ["Cristiano Ronaldo", "Messi", "Neymar", "Ronaldo Fenomeno"], correta: 1, cat: 'esportes', dificuldade: 'medio' },
    { pergunta: "O Super Bowl e a final de qual esporte?", opcoes: ["Futebol", "Futebol Americano", "Basebol", "Basquete"], correta: 1, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Qual pais sediou as Olimpiadas de 2020 (realizada em 2021)?", opcoes: ["China", "Japao", "Coreia do Sul", "Reino Unido"], correta: 1, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Quantos sets sao necessarios para vencer em uma partida de volei?", opcoes: ["2", "3", "4", "5"], correta: 1, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Qual o nome do piloto brasileiro campeao mundial de Formula 1?", opcoes: ["Felipe Massa", "Ayrton Senna", "Nelson Piquet", "Rubens Barrichello"], correta: 1, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Qual time brasileiro tem mais titulos mundiais de clubes?", opcoes: ["Flamengo", "Santos", "Sao Paulo", "Corinthians"], correta: 2, cat: 'esportes', dificuldade: 'medio' },
    { pergunta: "Esporte que combina natação, ciclismo e corrida?", opcoes: ["Decatlo", "Triatlo", "Pentatlo", "Heptatlo"], correta: 1, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Quantas faltas um jogador de basquete pode cometer antes de ser eliminado?", opcoes: ["4", "5", "6", "7"], correta: 1, cat: 'esportes', dificuldade: 'dificil' },
    { pergunta: "Qual time de futebol tem a maior torcida do Brasil?", opcoes: ["Flamengo", "Corinthians", "Sao Paulo", "Palmeiras"], correta: 0, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Qual e o esporte nacional do Japao?", opcoes: ["Judo", "Sumo", "Karate", "Beisebol"], correta: 1, cat: 'esportes', dificuldade: 'medio' },
    { pergunta: "Qual jogador de basquete e conhecido como 'King James'?", opcoes: ["Kobe Bryant", "Michael Jordan", "LeBron James", "Stephen Curry"], correta: 2, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Quantas medalhas de ouro Michael Phelps tem em Olimpiadas?", opcoes: ["18", "23", "28", "33"], correta: 1, cat: 'esportes', dificuldade: 'dificil' },
    { pergunta: "Qual pais sediou as Olimpiadas de 2012?", opcoes: ["Reino Unido", "China", "Russia", "Grecia"], correta: 0, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Quantos km tem uma maratona oficial?", opcoes: ["38.2 km", "40.0 km", "42.195 km", "45.0 km"], correta: 2, cat: 'esportes', dificuldade: 'medio' },
    { pergunta: "Qual pais venceu a Copa do Mundo de Rugby em 2019?", opcoes: ["Inglaterra", "Nova Zelandia", "Africa do Sul", "Australia"], correta: 2, cat: 'esportes', dificuldade: 'dificil' },
    { pergunta: "Em que ano o Brasil sediou a Copa do Mundo pela segunda vez?", opcoes: ["1950", "2014", "1962", "1970"], correta: 1, cat: 'esportes', dificuldade: 'medio' },
    { pergunta: "Qual time venceu a primeira edicao do Campeonato Brasileiro de 1971?", opcoes: ["Atletico Mineiro", "Palmeiras", "Santos", "Internacional"], correta: 0, cat: 'esportes', dificuldade: 'dificil' },
    { pergunta: "Qual era o numero da camisa de Michael Jordan no Chicago Bulls?", opcoes: ["33", "23", "45", "12"], correta: 1, cat: 'esportes', dificuldade: 'facil' },
    { pergunta: "Em quantos minutos e disputada uma partida de futebol sem acrescimos?", opcoes: ["80", "90", "100", "120"], correta: 1, cat: 'esportes', dificuldade: 'facil' },
];

// ===== PERGUNTAS - MUSICA =====
const perguntasMusica = [
    { pergunta: "Qual banda cantou 'Bohemian Rhapsody'?", opcoes: ["The Beatles", "Queen", "Led Zeppelin", "Pink Floyd"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Qual instrumento tem 88 teclas?", opcoes: ["Violao", "Piano", "Orgao", "Harpa"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Cantor conhecido como 'Rei do Pop'?", opcoes: ["Prince", "Michael Jackson", "Elvis Presley", "Madonna"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Quantas cordas tem um violao classico?", opcoes: ["4", "5", "6", "7"], correta: 2, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Cantora brasileira conhecida como 'Rainha do Rock'?", opcoes: ["Elis Regina", "Rita Lee", "Gal Costa", "Maria Bethânia"], correta: 1, cat: 'musica', dificuldade: 'medio' },
    { pergunta: "Que pais de originou o samba?", opcoes: ["Portugal", "Brasil", "Angola", "Cuba"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Banda britanica liderada por Freddie Mercury?", opcoes: ["The Rolling Stones", "Queen", "The Who", "The Kinks"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Compositor classico conhecido como 'O Menino Prodígio'?", opcoes: ["Bach", "Mozart", "Beethoven", "Chopin"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Cantor brasileiro conhecido como 'Rei'?", opcoes: ["Roberto Carlos", "Caetano Veloso", "Gilberto Gil", "Milton Nascimento"], correta: 0, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "O genero musical 'Rock' surgiu em qual decada?", opcoes: ["1940", "1950", "1960", "1970"], correta: 1, cat: 'musica', dificuldade: 'medio' },
    { pergunta: "Instrumento tipico do Hawaii?", opcoes: ["Banjo", "Ukulele", "Cavaquinho", "Bandolim"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Cantor de 'Thriller'?", opcoes: ["Prince", "Michael Jackson", "Stevie Wonder", "Lionel Richie"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Quantas sinfonias Beethoven compôs?", opcoes: ["7", "8", "9", "10"], correta: 2, cat: 'musica', dificuldade: 'medio' },
    { pergunta: "Cantor de 'Imagine'?", opcoes: ["John Lennon", "Paul McCartney", "Bob Dylan", "David Bowie"], correta: 0, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Tom Jobim e conhecido por criar qual genero musical?", opcoes: ["Samba", "Bossa Nova", "MPB", "Choro"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Qual banda tem o album 'The Dark Side of the Moon'?", opcoes: ["Pink Floyd", "Led Zeppelin", "Yes", "Genesis"], correta: 0, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Nome do festival brasileiro de musica que ocorre em Janeiro?", opcoes: ["Lollapalooza", "Rock in Rio", "Festival de Verao", "SWU"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Cantor de 'Billie Jean'?", opcoes: ["Prince", "Michael Jackson", "Usher", "Justin Timberlake"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Qual e o instrumento favorito de Jimi Hendrix?", opcoes: ["Baixo", "Guitarra", "Teclado", "Bateria"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Estilo musical com origem em Nova Orleans?", opcoes: ["Rock", "Jazz", "Blues", "Country"], correta: 1, cat: 'musica', dificuldade: 'medio' },
    { pergunta: "Qual banda lancou o album 'Abbey Road'?", opcoes: ["The Rolling Stones", "The Beatles", "The Who", "Pink Floyd"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Cantor de 'Purple Rain'?", opcoes: ["Prince", "Michael Jackson", "David Bowie", "Stevie Wonder"], correta: 0, cat: 'musica', dificuldade: 'medio' },
    { pergunta: "Quantas cordas tem um violino?", opcoes: ["3", "4", "5", "6"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Qual banda e liderada por Kurt Cobain?", opcoes: ["Pearl Jam", "Soundgarden", "Nirvana", "Alice in Chains"], correta: 2, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Genero musical originado na Jamaica?", opcoes: ["Salsa", "Reggae", "Samba", "Funk"], correta: 1, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Cantor de 'Garota de Ipanema'?", opcoes: ["Joao Gilberto", "Tom Jobim", "Vinicius de Moraes", "Caetano Veloso"], correta: 0, cat: 'musica', dificuldade: 'medio' },
    { pergunta: "Cantora conhecida como 'Rainha do Pop' brasileiro?", opcoes: ["Anitta", "Ivete Sangalo", "Mariah Carey", "Madonna"], correta: 0, cat: 'musica', dificuldade: 'facil' },
    { pergunta: "Qual e o nome real de Freddie Mercury?", opcoes: ["Farrokh Bulsara", "John Deacon", "Brian May", "Roger Taylor"], correta: 0, cat: 'musica', dificuldade: 'dificil' },
    { pergunta: "Qual compositor e conhecido como 'O Pai da Sinfonia'?", opcoes: ["Mozart", "Haydn", "Bach", "Beethoven"], correta: 1, cat: 'musica', dificuldade: 'dificil' },
    { pergunta: "Instrumento de sopro mais comum em orquestras?", opcoes: ["Flauta", "Trompete", "Clarinete", "Trombone"], correta: 0, cat: 'musica', dificuldade: 'medio' },
    { pergunta: "Qual e a nota musical que representa a frequencia 440 Hz?", opcoes: ["Do", "Re", "Mi", "La"], correta: 3, cat: 'musica', dificuldade: 'dificil' },
    { pergunta: "Qual pais e conhecido como o berco do Rock and Roll?", opcoes: ["Reino Unido", "Alemanha", "EUA", "Australia"], correta: 2, cat: 'musica', dificuldade: 'facil' },
];

// ===== PERGUNTAS - TECNOLOGIA =====
const perguntasTecnologia = [
    { pergunta: "O que significa a sigla 'CPU'?", opcoes: ["Central Process Unit", "Central Processing Unit", "Computer Personal Unit", "Core Process Unit"], correta: 1, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "Qual empresa criou o sistema Android?", opcoes: ["Apple", "Microsoft", "Google", "Samsung"], correta: 2, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "O que significa 'HTML'?", opcoes: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyper Transfer Markup Language"], correta: 0, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "Qual e a linguagem de programacao mais usada para web?", opcoes: ["Python", "Java", "JavaScript", "C++"], correta: 2, cat: 'tecnologia', dificuldade: 'medio' },
    { pergunta: "O que e um 'byte'?", opcoes: ["1 bit", "8 bits", "16 bits", "32 bits"], correta: 1, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "Empresa criadora do Windows?", opcoes: ["Apple", "Microsoft", "Google", "IBM"], correta: 1, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "O que significa 'www'?", opcoes: ["World Wide Web", "World Web Wide", "Web Wide World", "World Wide Work"], correta: 0, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "Qual o maior sistema operacional para servidores?", opcoes: ["Windows", "macOS", "Linux", "Android"], correta: 2, cat: 'tecnologia', dificuldade: 'medio' },
    { pergunta: "O que e 'RAM'?", opcoes: ["Memoria permanente", "Memoria de acesso aleatorio", "Processador", "Disco rigido"], correta: 1, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "Ano de lancamento do primeiro iPhone?", opcoes: ["2005", "2006", "2007", "2008"], correta: 2, cat: 'tecnologia', dificuldade: 'medio' },
    { pergunta: "Qual e o maior site de busca do mundo?", opcoes: ["Bing", "Google", "Yahoo", "DuckDuckGo"], correta: 1, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "O que e 'URL'?", opcoes: ["Endereco da internet", "Protocolo de rede", "Linguagem de programacao", "Sistema operacional"], correta: 0, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "O que e 'Python'?", opcoes: ["Linguagem de programacao", "Site de busca", "Sistema operacional", "Navegador"], correta: 0, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "Qual e a resolucao Full HD?", opcoes: ["1280x720", "1920x1080", "2560x1440", "3840x2160"], correta: 1, cat: 'tecnologia', dificuldade: 'medio' },
    { pergunta: "Nome do navegador da Google?", opcoes: ["Safari", "Firefox", "Chrome", "Edge"], correta: 2, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "O que significa 'USB'?", opcoes: ["Universal Serial Bus", "United Serial Bus", "Universal System Bus", "Unified Serial Board"], correta: 0, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "O que e 'The Cloud' (nuvem)?", opcoes: ["Servidores remotos", "Internet", "Disco rigido externo", "Rede local"], correta: 0, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "Qual criptomoeda foi a primeira criada?", opcoes: ["Ethereum", "Bitcoin", "Litecoin", "Dogecoin"], correta: 1, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "O que e 'Bluetooth'?", opcoes: ["Protocolo de comunicacao sem fio", "Padrao de video", "Tipo de bateria", "Conector USB"], correta: 0, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "O que significa 'SSD'?", opcoes: ["Solid State Drive", "Super Speed Disk", "System Storage Device", "Silicon Storage Drive"], correta: 0, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "O que significa 'API'?", opcoes: ["Application Programming Interface", "Application Process Integration", "Automated Program Interface", "Advanced Programming Interface"], correta: 0, cat: 'tecnologia', dificuldade: 'medio' },
    { pergunta: "Qual empresa e dona do Instagram?", opcoes: ["Google", "Microsoft", "Apple", "Meta"], correta: 3, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "O que significa 'HTTP'?", opcoes: ["HyperText Transfer Protocol", "High Tech Transfer Process", "Hyper Transfer Text Protocol", "Home Tool Transfer Protocol"], correta: 0, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "Qual e o nucleo do sistema operacional Linux?", opcoes: ["Kernel", "Shell", "BIOS", "Bootloader"], correta: 0, cat: 'tecnologia', dificuldade: 'medio' },
    { pergunta: "Criptomoeda criada por Vitalik Buterin?", opcoes: ["Bitcoin", "Litecoin", "Ethereum", "Dogecoin"], correta: 2, cat: 'tecnologia', dificuldade: 'medio' },
    { pergunta: "O que significa 'JSON'?", opcoes: ["Java Standard Object Notation", "JavaScript Object Notation", "Java Source Object Network", "JavaScript Online Network"], correta: 1, cat: 'tecnologia', dificuldade: 'medio' },
    { pergunta: "Qual empresa criou o processador Ryzen?", opcoes: ["Intel", "NVIDIA", "AMD", "ARM"], correta: 2, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "O que e um 'firewall'?", opcoes: ["Antivirus", "Sistema de seguranca de rede", "Navegador", "Servidor web"], correta: 1, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "Qual linguagem de programacao e conhecida como 'a mais antiga ainda em uso'?", opcoes: ["Python", "Java", "C", "Fortran"], correta: 2, cat: 'tecnologia', dificuldade: 'dificil' },
    { pergunta: "O que significa 'AI' (inteligencia artificial)?", opcoes: ["Artificial Intelligence", "Automated Input", "Algorithm Integration", "Advanced Interface"], correta: 0, cat: 'tecnologia', dificuldade: 'facil' },
    { pergunta: "Qual resolucao e conhecida como 4K?", opcoes: ["1920x1080", "2560x1440", "3840x2160", "7680x4320"], correta: 2, cat: 'tecnologia', dificuldade: 'medio' },
    { pergunta: "O que significa 'IoT'?", opcoes: ["Internet of Things", "Input Output Terminal", "Integrated Operating Technology", "Internal Object Tracking"], correta: 0, cat: 'tecnologia', dificuldade: 'medio' },
];

// ===== PERGUNTAS - ANIMES =====
const perguntasAnimes = [
    { pergunta: "Qual anime tem o protagonista chamado 'Naruto Uzumaki'?", opcoes: ["One Piece", "Dragon Ball", "Bleach", "Naruto"], correta: 3, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Em 'Dragon Ball', qual e o nome do Sayajin lendario?", opcoes: ["Goku", "Vegeta", "Broly", "Gohan"], correta: 2, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Qual e o nome do protagonista de 'One Piece'?", opcoes: ["Zoro", "Luffy", "Sanji", "Nami"], correta: 1, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Estudio famoso por filmes como 'A Viagem de Chihiro'?", opcoes: ["Toei", "Madhouse", "Ghibli", "Kyoto Animation"], correta: 2, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Em 'Attack on Titan', qual o nome do protagonista?", opcoes: ["Levi", "Eren", "Mikasa", "Armin"], correta: 1, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Qual anime apresenta o personagem 'Saitama'?", opcoes: ["Naruto", "Mob Psycho 100", "Dragon Ball", "One Punch Man"], correta: 3, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Em 'Pokemon', qual e o nome do protagonista?", opcoes: ["Ash", "Red", "Gary", "Brock"], correta: 0, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Qual anime tem 'Gojo Satoru' e 'Yuji Itadori'?", opcoes: ["Demon Slayer", "Jujutsu Kaisen", "Attack on Titan", "My Hero Academia"], correta: 1, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Em 'Demon Slayer', qual o nome do protagonista?", opcoes: ["Nezuko", "Zenitsu", "Inosuke", "Tanjiro"], correta: 3, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Anime que apresenta o 'Exame Hunter'?", opcoes: ["Hunter x Hunter", "Black Clover", "Fairy Tail", "Sword Art Online"], correta: 0, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Qual anime e sobre alquimia?", opcoes: ["Fullmetal Alchemist", "Attack on Titan", "Steins;Gate", "Vinland Saga"], correta: 0, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Em 'Death Note', qual o nome do Shinigami principal?", opcoes: ["Ryuk", "Rem", "Sidoh", "Gelus"], correta: 0, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Qual e o protagonista de 'Sword Art Online'?", opcoes: ["Kirito", "Asuna", "Yui", "Klein"], correta: 0, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Em 'My Hero Academia', qual e o nome do protagonista?", opcoes: ["Bakugo", "Midoriya", "Todoroki", "All Might"], correta: 1, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Qual o nome do protagonista de 'Cowboy Bebop'?", opcoes: ["Spike Spiegel", "Jet Black", "Vicious", "Laughing Bull"], correta: 0, cat: 'animes', dificuldade: 'medio' },
    { pergunta: "Em 'Neon Genesis Evangelion', qual e o nome do protagonista?", opcoes: ["Kaworu", "Shinji", "Rei", "Asuka"], correta: 1, cat: 'animes', dificuldade: 'medio' },
    { pergunta: "Protagonista de 'Tokyo Ghoul'?", opcoes: ["Touka", "Kaneki", "Hide", "Amon"], correta: 1, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Anime onde o protagonista encontra um livro que mata pessoas?", opcoes: ["Death Note", "Future Diary", "Another", "Corpse Party"], correta: 0, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "A organizacao 'Akatsuki' aparece em qual anime?", opcoes: ["Naruto", "One Piece", "Bleach", "Dragon Ball"], correta: 0, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Nome do protagonista de 'Bleach'?", opcoes: ["Rukia", "Ichigo", "Renji", "Byakuya"], correta: 1, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Qual anime mostra uma guerra entre humanos e titãs?", opcoes: ["Attack on Titan", "Seraph of the End", "Kabaneri", "God of War"], correta: 0, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Em 'Code Geass', qual o poder de Lelouch?", opcoes: ["Geass", "Stand", "Nen", "Chakra"], correta: 0, cat: 'animes', dificuldade: 'medio' },
    { pergunta: "Nome do protagonista de 'Vinland Saga'?", opcoes: ["Thorfinn", "Askeladd", "Canute", "Thor"], correta: 0, cat: 'animes', dificuldade: 'medio' },
    { pergunta: "Em 'Steins;Gate', como se chama o protagonista?", opcoes: ["Okabe Rintaro", "Daru", "Mayuri", "Kurisu"], correta: 0, cat: 'animes', dificuldade: 'medio' },
    { pergunta: "Qual e o maior anime em numero de episodios?", opcoes: ["One Piece", "Naruto", "Dragon Ball", "Sazae-san"], correta: 3, cat: 'animes', dificuldade: 'dificil' },
    { pergunta: "Em 'One Piece', qual e o nome do navio dos Chapeus de Palha?", opcoes: ["Red Force", "Thousand Sunny", "Oro Jackson", "Moby Dick"], correta: 1, cat: 'animes', dificuldade: 'medio' },
    { pergunta: "Criador de 'One Piece'?", opcoes: ["Masashi Kishimoto", "Eiichiro Oda", "Tite Kubo", "Akira Toriyama"], correta: 1, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Em 'Dragon Ball Z', qual e o nome do pai de Goku?", opcoes: ["Bardock", "King Vegeta", "Raditz", "Paragus"], correta: 0, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Em 'Attack on Titan', qual e o nome do Titan de Eren?", opcoes: ["Titan Colossal", "Titan Blindado", "Titan de Ataque", "Titan Bestial"], correta: 2, cat: 'animes', dificuldade: 'medio' },
    { pergunta: "Em 'Naruto', qual e o nome da tecnica de invocacao de sapos?", opcoes: ["Rasengan", "Chidori", "Kuchiyose", "Shadow Clone"], correta: 2, cat: 'animes', dificuldade: 'medio' },
    { pergunta: "Qual anime e sobre um cavaleiro amaldicoado chamado Guts?", opcoes: ["Vinland Saga", "Berserk", "Claymore", "Vagabond"], correta: 1, cat: 'animes', dificuldade: 'medio' },
    { pergunta: "Em 'My Hero Academia', qual e a individualidade de All Might?", opcoes: ["Explosion", "One For All", "All For One", "Half-Cold Half-Hot"], correta: 1, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Em 'Death Note', qual e o nome do detetive que persegue Light?", opcoes: ["Near", "Mello", "L", "Watari"], correta: 2, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Qual anime apresenta as pedras filosofais?", opcoes: ["Fullmetal Alchemist", "Hunter x Hunter", "Fairy Tail", "Black Clover"], correta: 0, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Em 'Demon Slayer', qual e o nome da irmã de Tanjiro?", opcoes: ["Shinobu", "Mitsuri", "Nezuko", "Kanao"], correta: 2, cat: 'animes', dificuldade: 'facil' },
    { pergunta: "Qual e o nome do protagonista de 'Mob Psycho 100'?", opcoes: ["Shigeo Kageyama", "Arataka Reigen", "Teruki Hanazawa", "Ritsu Kageyama"], correta: 0, cat: 'animes', dificuldade: 'medio' },
    { pergunta: "Em qual anime aparece a espada 'Excalibur'?", opcoes: ["Fate/Stay Night", "Sword Art Online", "Soul Eater", "Bleach"], correta: 0, cat: 'animes', dificuldade: 'dificil' },
];

// ===== PERGUNTAS - LITERATURA =====
const perguntasLiteratura = [
    { pergunta: "Quem escreveu 'Dom Casmurro'?", opcoes: ["Jose de Alencar", "Machado de Assis", "Clarice Lispector", "Graciliano Ramos"], correta: 1, cat: 'literatura', dificuldade: 'medio' },
    { pergunta: "Autor de 'O Pequeno Principe'?", opcoes: ["Victor Hugo", "Antoine de Saint-Exupery", "Jules Verne", "Mark Twain"], correta: 1, cat: 'literatura', dificuldade: 'facil' },
    { pergunta: "Obra mais famosa de Shakespeare?", opcoes: ["Hamlet", "Macbeth", "Romeu e Julieta", "Otelo"], correta: 2, cat: 'literatura', dificuldade: 'facil' },
    { pergunta: "Quem escreveu '1984'?", opcoes: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "H.G. Wells"], correta: 1, cat: 'literatura', dificuldade: 'medio' },
    { pergunta: "Autor de 'O Alquimista'?", opcoes: ["Paulo Coelho", "Jorge Amado", "Erico Verissimo", "Machado de Assis"], correta: 0, cat: 'literatura', dificuldade: 'facil' },
    { pergunta: "A Divina Comedia foi escrita por quem?", opcoes: ["Petrarca", "Boccaccio", "Dante Alighieri", "Homero"], correta: 2, cat: 'literatura', dificuldade: 'medio' },
    { pergunta: "Autor de 'O Senhor dos Aneis'?", opcoes: ["C.S. Lewis", "J.R.R. Tolkien", "J.K. Rowling", "George R.R. Martin"], correta: 1, cat: 'literatura', dificuldade: 'facil' },
    { pergunta: "Nome do personagem principal de 'Dom Quixote'?", opcoes: ["Sancho Pança", "Quixote", "Alonso", "Dulcineia"], correta: 1, cat: 'literatura', dificuldade: 'facil' },
    { pergunta: "Quem escreveu 'Os Lusiadas'?", opcoes: ["Camões", "Fernando Pessoa", "Eca de Queiros", "Gil Vicente"], correta: 0, cat: 'literatura', dificuldade: 'medio' },
    { pergunta: "Autora de 'Harry Potter'?", opcoes: ["J.K. Rowling", "Stephenie Meyer", "Suzanne Collins", "Veronica Roth"], correta: 0, cat: 'literatura', dificuldade: 'facil' },
    { pergunta: "Escritor brasileiro famoso por 'Capitaes da Areia'?", opcoes: ["Jorge Amado", "Machado de Assis", "Graciliano Ramos", "Erico Verissimo"], correta: 0, cat: 'literatura', dificuldade: 'medio' },
    { pergunta: "O livro 'Moby Dick' e sobre o que?", opcoes: ["Uma baleia", "Um navio", "Um marinheiro", "Um porto"], correta: 0, cat: 'literatura', dificuldade: 'facil' },
    { pergunta: "Autora de 'A Hora da Estrela'?", opcoes: ["Clarice Lispector", "Cecilia Meireles", "Adelia Prado", "Cora Coralina"], correta: 0, cat: 'literatura', dificuldade: 'dificil' },
    { pergunta: "Classico da literatura universal escrito por Homero?", opcoes: ["Odisseia", "Eneida", "Divina Comedia", "Os Lusiadas"], correta: 0, cat: 'literatura', dificuldade: 'medio' },
    { pergunta: "Livro mais vendido da historia (excluindo religiosos)?", opcoes: ["Dom Quixote", "Um Conto de Duas Cidades", "O Pequeno Principe", "O Alquimista"], correta: 1, cat: 'literatura', dificuldade: 'dificil' },
    { pergunta: "Quem escreveu 'Grande Sertao: Veredas'?", opcoes: ["Guimaraes Rosa", "Graciliano Ramos", "Jorge Amado", "Rachel de Queiroz"], correta: 0, cat: 'literatura', dificuldade: 'dificil' },
    { pergunta: "O poeta brasileiro autor de 'Quadrilha'?", opcoes: ["Carlos Drummond de Andrade", "Manuel Bandeira", "Vinicius de Moraes", "Joao Cabral de Melo Neto"], correta: 0, cat: 'literatura', dificuldade: 'dificil' },
    { pergunta: "Quem escreveu 'O Cortico'?", opcoes: ["Machado de Assis", "Jose de Alencar", "Aluisio Azevedo", "Eca de Queiros"], correta: 2, cat: 'literatura', dificuldade: 'dificil' },
    { pergunta: "Autora de 'O Quinze'?", opcoes: ["Rachel de Queiroz", "Clarice Lispector", "Cecilia Meireles", "Adelia Prado"], correta: 0, cat: 'literatura', dificuldade: 'dificil' },
    { pergunta: "Livro de George Orwell sobre uma fazenda de animais?", opcoes: ["1984", "A Revolucao dos Bichos", "O Lobo do Mar", "Admiravel Mundo Novo"], correta: 1, cat: 'literatura', dificuldade: 'facil' },
    { pergunta: "Quem escreveu 'O Apanhador no Campo de Centeio'?", opcoes: ["J.D. Salinger", "Ernest Hemingway", "F. Scott Fitzgerald", "William Faulkner"], correta: 0, cat: 'literatura', dificuldade: 'dificil' },
    { pergunta: "Escritor brasileiro autor de 'Vidas Secas'?", opcoes: ["Graciliano Ramos", "Jorge Amado", "Machado de Assis", "Guimaraes Rosa"], correta: 0, cat: 'literatura', dificuldade: 'medio' },
    { pergunta: "Protagonista de 'Os Miseraveis'?", opcoes: ["Jean Valjean", "Javert", "Marius", "Fantine"], correta: 0, cat: 'literatura', dificuldade: 'medio' },
    { pergunta: "Quem escreveu 'Orgulho e Preconceito'?", opcoes: ["Emily Bronte", "Jane Austen", "Charlotte Bronte", "Mary Shelley"], correta: 1, cat: 'literatura', dificuldade: 'medio' },
    { pergunta: "Pais de origem do escritor Franz Kafka?", opcoes: ["Alemanha", "Austria", "Republica Tcheca", "Hungria"], correta: 2, cat: 'literatura', dificuldade: 'dificil' },
    { pergunta: "Obra mais famosa de Fernando Pessoa?", opcoes: ["Mensagem", "O Guardador de Rebanhos", "Livro do Desassossego", "Poesias"], correta: 0, cat: 'literatura', dificuldade: 'medio' },
    { pergunta: "Quem escreveu 'Cem Anos de Solidao'?", opcoes: ["Julio Cortazar", "Gabriel Garcia Marquez", "Mario Vargas Llosa", "Jorge Luis Borges"], correta: 1, cat: 'literatura', dificuldade: 'medio' },
    { pergunta: "Genero literario de 'O Senhor dos Aneis'?", opcoes: ["Ficcao Cientifica", "Fantasia Epica", "Romance Historico", "Terror"], correta: 1, cat: 'literatura', dificuldade: 'facil' },
    { pergunta: "Quem escreveu 'A Moreninha'?", opcoes: ["Joaquim Manuel de Macedo", "Jose de Alencar", "Alvares de Azevedo", "Goncalves Dias"], correta: 0, cat: 'literatura', dificuldade: 'dificil' },
];

// ===== PERGUNTAS - ARTE =====
const perguntasArte = [
    { pergunta: "Quem pintou 'O Grito'?", opcoes: ["Van Gogh", "Munch", "Picasso", "Da Vinci"], correta: 1, cat: 'arte', dificuldade: 'medio' },
    { pergunta: "Estilo artistico de Picasso?", opcoes: ["Impressionismo", "Cubismo", "Surrealismo", "Expressionismo"], correta: 1, cat: 'arte', dificuldade: 'medio' },
    { pergunta: "Obra mais famosa de Michelangelo?", opcoes: ["Mona Lisa", "Davide", "O Nascimento de Venus", "A Ultima Ceia"], correta: 1, cat: 'arte', dificuldade: 'facil' },
    { pergunta: "Quem pintou 'A Noite Estrelada'?", opcoes: ["Monet", "Van Gogh", "Cezanne", "Gauguin"], correta: 1, cat: 'arte', dificuldade: 'facil' },
    { pergunta: "Qual e o museu mais famoso de Paris?", opcoes: ["Museu de Orsay", "Louvre", "Centro Pompidou", "Museu Rodin"], correta: 1, cat: 'arte', dificuldade: 'facil' },
    { pergunta: "Escultor de 'O Pensador'?", opcoes: ["Michelangelo", "Rodin", "Donatello", "Bernini"], correta: 1, cat: 'arte', dificuldade: 'medio' },
    { pergunta: "Quem pintou 'A Persistencia da Memoria'?", opcoes: ["Picasso", "Dali", "Magritte", "Miro"], correta: 1, cat: 'arte', dificuldade: 'facil' },
    { pergunta: "O 'MASP' e um museu localizado em qual cidade?", opcoes: ["Rio de Janeiro", "Brasilia", "Sao Paulo", "Salvador"], correta: 2, cat: 'arte', dificuldade: 'facil' },
    { pergunta: "Movimento artistico brasileiro de 1922?", opcoes: ["Semana de Arte Moderna", "Barroco", "Arcadianismo", "Romantismo"], correta: 0, cat: 'arte', dificuldade: 'medio' },
    { pergunta: "Quem pintou 'A Ultima Ceia'?", opcoes: ["Michelangelo", "Da Vinci", "Rafael", "Ticiano"], correta: 1, cat: 'arte', dificuldade: 'facil' },
    { pergunta: "Artista conhecido por suas latas de sopa Campbell?", opcoes: ["Andy Warhol", "Roy Lichtenstein", "Jasper Johns", "Robert Rauschenberg"], correta: 0, cat: 'arte', dificuldade: 'medio' },
    { pergunta: "Artista brasileira autora do 'Abaporu'?", opcoes: ["Portinari", "Tarsila do Amaral", "Anita Malfatti", "Di Cavalcanti"], correta: 1, cat: 'arte', dificuldade: 'dificil' },
    { pergunta: "O 'Vaticano' abriga qual famosa capela?", opcoes: ["Capela Sistina", "Capela de Onze Mil Virgens", "Capela Palatina", "Capela Scrovegni"], correta: 0, cat: 'arte', dificuldade: 'medio' },
    { pergunta: "Qual artista pintava bailarinas?", opcoes: ["Monet", "Degas", "Renoir", "Manet"], correta: 1, cat: 'arte', dificuldade: 'dificil' },
    { pergunta: "Qual movimento artistico Dali pertencia?", opcoes: ["Cubismo", "Surrealismo", "Dadaismo", "Futurismo"], correta: 1, cat: 'arte', dificuldade: 'medio' },
    { pergunta: "Obra 'O Beijo' e de qual artista?", opcoes: ["Gustav Klimt", "Edvard Munch", "Pablo Picasso", "Claude Monet"], correta: 0, cat: 'arte', dificuldade: 'dificil' },
    { pergunta: "Pintor famoso por seus nenufares (aguas)?", opcoes: ["Van Gogh", "Monet", "Renoir", "Degas"], correta: 1, cat: 'arte', dificuldade: 'medio' },
    { pergunta: "Qual movimento artistico surgiu nos anos 1910 na Franca?", opcoes: ["Cubismo", "Impressionismo", "Dadaismo", "Surrealismo"], correta: 0, cat: 'arte', dificuldade: 'medio' },
    { pergunta: "Escultor do 'David'?", opcoes: ["Donatello", "Bernini", "Michelangelo", "Rodin"], correta: 2, cat: 'arte', dificuldade: 'facil' },
    { pergunta: "Museu de arte contemporanea em Sao Paulo?", opcoes: ["MASP", "Pinacoteca", "MAC", "MAM"], correta: 2, cat: 'arte', dificuldade: 'dificil' },
    { pergunta: "Pintura 'Guernica' retrata qual guerra?", opcoes: ["Primeira Guerra", "Guerra Civil Espanhola", "Segunda Guerra", "Guerra Fria"], correta: 1, cat: 'arte', dificuldade: 'dificil' },
    { pergunta: "Onde esta localizado o museu do Louvre?", opcoes: ["Londres", "Paris", "Roma", "Madri"], correta: 1, cat: 'arte', dificuldade: 'facil' },
    { pergunta: "Fotografo brasileiro famoso por fotos de indigenas?", opcoes: ["Sebastiao Salgado", "Vik Muniz", "Araquem Alcantara", "Bob Wolfenson"], correta: 0, cat: 'arte', dificuldade: 'medio' },
    { pergunta: "Qual artista pintou 'American Gothic'?", opcoes: ["Grant Wood", "Edward Hopper", "Norman Rockwell", "Andrew Wyeth"], correta: 0, cat: 'arte', dificuldade: 'dificil' },
    { pergunta: "Qual artista brasileira pintou 'Operarios'?", opcoes: ["Tarsila do Amaral", "Anita Malfatti", "Candido Portinari", "Di Cavalcanti"], correta: 0, cat: 'arte', dificuldade: 'dificil' },
    { pergunta: "O movimento 'Pop Art' ficou famoso em qual decada?", opcoes: ["1950", "1960", "1970", "1980"], correta: 1, cat: 'arte', dificuldade: 'medio' },
    { pergunta: "Qual artista e conhecido por suas esculturas de baloes de cachorro?", opcoes: ["Jeff Koons", "Damien Hirst", "Banksy", "Ai Weiwei"], correta: 0, cat: 'arte', dificuldade: 'dificil' },
];

// ===== PERGUNTAS - CURIOSIDADES =====
const perguntasCuriosidades = [
    { pergunta: "Quantos continentes existem no mundo?", opcoes: ["5", "6", "7", "8"], correta: 2, cat: 'curiosidades', dificuldade: 'facil' },
    { pergunta: "Qual e o maior animal do mundo?", opcoes: ["Elefante", "Baleia Azul", "Girafa", "Tubarao Baleia"], correta: 1, cat: 'curiosidades', dificuldade: 'facil' },
    { pergunta: "Qual a cor mais rara na natureza?", opcoes: ["Vermelho", "Azul", "Verde", "Amarelo"], correta: 1, cat: 'curiosidades', dificuldade: 'dificil' },
    { pergunta: "Qual e o pais mais antigo do mundo?", opcoes: ["Grecia", "Egito", "Japao", "China"], correta: 1, cat: 'curiosidades', dificuldade: 'medio' },
    { pergunta: "Cidade mais populosa do mundo?", opcoes: ["Toquio", "Xangai", "Nova York", "Mumbai"], correta: 0, cat: 'curiosidades', dificuldade: 'medio' },
    { pergunta: "Quantas linguas existem no mundo?", opcoes: ["Cerca de 2000", "Cerca de 4000", "Cerca de 7000", "Cerca de 10000"], correta: 2, cat: 'curiosidades', dificuldade: 'dificil' },
    { pergunta: "Animal conhecido como 'o rei da selva'?", opcoes: ["Tigre", "Leao", "Urso", "Lobo"], correta: 1, cat: 'curiosidades', dificuldade: 'facil' },
    { pergunta: "Quantos dentes tem um caracol?", opcoes: ["100", "1000", "14000", "25000"], correta: 3, cat: 'curiosidades', dificuldade: 'dificil' },
    { pergunta: "O pimentao e uma?", opcoes: ["Legume", "Fruta", "Verdura", "Tuberculo"], correta: 1, cat: 'curiosidades', dificuldade: 'dificil' },
    { pergunta: "Quantos coracoes tem um polvo?", opcoes: ["1", "2", "3", "4"], correta: 2, cat: 'curiosidades', dificuldade: 'medio' },
    { pergunta: "Qual e a maior estrutura viva do mundo?", opcoes: ["Grande Barreira de Corais", "Floresta Amazonica", "Muralha da China", "Baobá"], correta: 0, cat: 'curiosidades', dificuldade: 'dificil' },
    { pergunta: "Quantos kilometres tem o Muro da China?", opcoes: ["Cerca de 5000 km", "Cerca de 13000 km", "Cerca de 21000 km", "Cerca de 30000 km"], correta: 2, cat: 'curiosidades', dificuldade: 'dificil' },
    { pergunta: "Comida mais consumida no mundo?", opcoes: ["Arroz", "Trigo", "Milho", "Batata"], correta: 0, cat: 'curiosidades', dificuldade: 'medio' },
    { pergunta: "Quantas horas tem um dia em Venus?", opcoes: ["24h", "243h", "365h", "18h"], correta: 1, cat: 'curiosidades', dificuldade: 'dificil' },
    { pergunta: "Animal que nunca dorme?", opcoes: ["Golfinho", "Tubarao", "Formiga", "Cavalo"], correta: 1, cat: 'curiosidades', dificuldade: 'dificil' },
    { pergunta: "O que e a 'Aurora Boreal'?", opcoes: ["Fenomeno luminoso atmosferico", "Estrela cadente", "Eclipse solar", "Arco-iris"], correta: 0, cat: 'curiosidades', dificuldade: 'facil' },
    { pergunta: "Quantos planetas anoes tem o sistema solar?", opcoes: ["2", "3", "4", "5"], correta: 3, cat: 'curiosidades', dificuldade: 'dificil' },
    { pergunta: "Qual e o livro mais vendido da historia?", opcoes: ["Dom Quixote", "A Biblia", "O Pequeno Principe", "Harry Potter"], correta: 1, cat: 'curiosidades', dificuldade: 'facil' },
    { pergunta: "Quantos ossos tem um bebe ao nascer?", opcoes: ["206", "270", "300", "350"], correta: 2, cat: 'curiosidades', dificuldade: 'dificil' },
    { pergunta: "Qual e o pais com mais vulcoes ativos?", opcoes: ["Japao", "Indonesia", "Islandia", "Italia"], correta: 1, cat: 'curiosidades', dificuldade: 'dificil' },
    { pergunta: "Qual e a maior ilha do mundo?", opcoes: ["Groenlandia", "Madagascar", "Borneo", "Nova Guine"], correta: 0, cat: 'curiosidades', dificuldade: 'medio' },
    { pergunta: "Quantos fusos horarios tem a Russia?", opcoes: ["5", "7", "11", "13"], correta: 2, cat: 'curiosidades', dificuldade: 'dificil' },
    { pergunta: "O que e 'Mona Lisa'?", opcoes: ["Uma escultura", "Uma pintura", "Uma musica", "Um livro"], correta: 1, cat: 'curiosidades', dificuldade: 'facil' },
    { pergunta: "Qual metal e liquido a temperatura ambiente?", opcoes: ["Ouro", "Mercurio", "Prata", "Chumbo"], correta: 1, cat: 'curiosidades', dificuldade: 'medio' },
    { pergunta: "Maior deserto quente do mundo?", opcoes: ["Gobi", "Atacama", "Saara", "Kalahari"], correta: 2, cat: 'curiosidades', dificuldade: 'facil' },
    { pergunta: "Quantas especies de pinguins existem aproximadamente?", opcoes: ["10", "14", "18", "22"], correta: 2, cat: 'curiosidades', dificuldade: 'dificil' },
    { pergunta: "Qual a fruta mais consumida no mundo?", opcoes: ["Banana", "Maca", "Laranja", "Uva"], correta: 0, cat: 'curiosidades', dificuldade: 'medio' },
    { pergunta: "Maior pais da America do Sul em area?", opcoes: ["Argentina", "Brasil", "Peru", "Colombia"], correta: 1, cat: 'curiosidades', dificuldade: 'facil' },
    { pergunta: "O que causa o efeito estufa?", opcoes: ["Gases poluentes", "Buraco na camada de ozonio", "Desmatamento", "Todos contribuem"], correta: 3, cat: 'curiosidades', dificuldade: 'medio' },
];

// ===== REGISTRO DE GENEROS =====
const generos = {};

function registrarGenero(id, nome, icone, desc, cor, perguntasArray) {
    generos[id] = { id, nome, icone, desc, cor, perguntas: perguntasArray };
}

registrarGenero('games', 'Games', '🎮', 'Geral, FPS, RPG, Pixel...', '#4ade80', perguntasGames);
registrarGenero('filmes', 'Filmes', '🎬', 'Acao, Ficcao, Animacao...', '#f7971e', perguntasFilmes);
registrarGenero('matematica', 'Matematica', '📐', 'Equacoes, Geometria, Logica...', '#f87171', perguntasMatematica);
registrarGenero('geografia', 'Geografia', '🌍', 'Paises, Capitais, Rios...', '#3b82f6', perguntasGeografia);
registrarGenero('ciencias', 'Ciencias', '🔬', 'Biologia, Quimica, Fisica...', '#8b5cf6', perguntasCiencias);
registrarGenero('historia', 'Historia', '📜', 'Brasil, Mundo, Guerras...', '#f59e0b', perguntasHistoria);
registrarGenero('esportes', 'Esportes', '⚽', 'Futebol, Basquete, Formula 1...', '#10b981', perguntasEsportes);
registrarGenero('musica', 'Musica', '🎵', 'Bandas, Instrumentos, Teoria...', '#ec4899', perguntasMusica);
registrarGenero('tecnologia', 'Tecnologia', '💻', 'Programacao, Hardware, Internet...', '#14b8a6', perguntasTecnologia);
registrarGenero('animes', 'Animes', '🗾', 'Dragon Ball, Naruto, One Piece...', '#e8637a', perguntasAnimes);
registrarGenero('literatura', 'Literatura', '📚', 'Livros, Autores, Classic...', '#a855f7', perguntasLiteratura);
registrarGenero('arte', 'Arte', '🎨', 'Pintura, Escultura, Museus...', '#e8637a', perguntasArte);
registrarGenero('curiosidades', 'Curiosidades', '🐱', 'Fatos interessantes e gerais...', '#fbbf24', perguntasCuriosidades);

// Genero "Todos" combina todos automaticamente
const perguntasTodos = [];
for (const [id, g] of Object.entries(generos)) {
    perguntasTodos.push(...g.perguntas);
}
registrarGenero('todos', 'Todos', '🌟', 'Mistura completa!', '#ffd700', perguntasTodos);



// ===== CHARACTER DATA =====
const CHARACTERS = [
  { id:"naruto", name:"Naruto", image:"public/characters/naruto.png", color:"#f7971e", rarity:"rare", price:150,
    power:{ name:"Modo Sabio", desc:"+50 XP no proximo acerto", icon:"🍃", type:"xp_bonus", color:"#f7971e" },
    passive:{ name:"Determinação", desc:"+5% XP em todas as fontes" },
    details:{ quote:"Vou me tornar Hokage, acredite!", emojis:["🍜","🦊","🌀"], bgColors:["#f7971e","#ff6b00"] }
  },
  { id:"goku", name:"Goku", image:"public/characters/goku.png", color:"#f87171", rarity:"rare", price:150,
    power:{ name:"Kamehameha", desc:"Elimina 2 opcoes erradas", icon:"⚡", type:"eliminar_opcoes", color:"#3b82f6" },
    passive:{ name:"Super Saiyajin", desc:"+1 vida no inicio do quiz" },
    details:{ quote:"Isso ultrapassa 9000!", emojis:["🐉","✨","🍚"], bgColors:["#f87171","#3b82f6"] }
  },
  { id:"luffy", name:"Luffy", image:"public/characters/luffy.png", color:"#f87171", rarity:"rare", price:150,
    power:{ name:"Gomu Gomu", desc:"Pula a questao sem perder vida", icon:"🪨", type:"pular_questao", color:"#ef4444" },
    passive:{ name:"Rei dos Piratas", desc:"+10% moedas ganhas" },
    details:{ quote:"Eu vou ser o Rei dos Piratas!", emojis:["☠️","🍖","🏴‍☠️"], bgColors:["#f87171","#fbbf24"] }
  },
  { id:"pikachu", name:"Pikachu", image:"public/characters/pikachu.png", color:"#fbbf24", rarity:"rare", price:150,
    power:{ name:"Choque do Trovao", desc:"Revela a resposta certa por 2s", icon:"⚡", type:"revelar_resposta", color:"#fbbf24" },
    passive:{ name:"Eletricidade", desc:"+3s extra no timer" },
    details:{ quote:"Pika Pika!", emojis:["⚡","⚡","🔋"], bgColors:["#fbbf24","#f59e0b"] }
  },
  { id:"tanjiro", name:"Tanjiro", image:"public/characters/tanjiro.png", color:"#4ade80", rarity:"epic", price:150,
    power:{ name:"Respiracao da Agua", desc:"Recupera 1 vida", icon:"🌊", type:"curar_vida", color:"#4ade80" },
    passive:{ name:"Fôlego Constante", desc:"10% chance de nao perder vida ao errar" },
    details:{ quote:"Hinokami Kagura!", emojis:["🌊","🗡️","💧"], bgColors:["#4ade80","#1a6b3c"] }
  },
  { id:"gojo", name:"Gojo", image:"public/characters/gojo.png", color:"#3b82f6", rarity:"mythic", price:150,
    power:{ name:"Roxo (Hollow Purple)", desc:"PASSAR AUTOMATICO na questao! 💜", icon:"💜", type:"passar_questao", color:"#a855f7" },
    passive:{ name:"Seis Olhos", desc:"Poder pode ser usado 2 vezes por quiz" },
    details:{ quote:"Nah, eu venceria.", emojis:["💜","👁️","🌀"], bgColors:["#3b82f6","#1e3a5f"] }
  },
  { id:"mikasa", name:"Mikasa", image:"public/characters/mikasa.png", color:"#8b5cf6", rarity:"epic", price:150,
    power:{ name:"Laminas Titanicas", desc:"Dobra moedas no proximo acerto", icon:"🗡️", type:"moedas_dobradas", color:"#8b5cf6" },
    passive:{ name:"Lealdade", desc:"+2 moedas extras por acerto" },
    details:{ quote:"Esse mundo e cruel...", emojis:["🗡️","🧣","🕊️"], bgColors:["#8b5cf6","#4a1d6e"] }
  },
  { id:"sailor", name:"Sailor Moon", image:"public/characters/sailor.png", color:"#ec4899", rarity:"epic", price:150,
    power:{ name:"Moon Healing", desc:"Restaura TODAS as vidas!", icon:"🌙", type:"curar_tudo", color:"#ec4899" },
    passive:{ name:"Luar", desc:"Comeca cada quiz com todas as vidas +1 extra" },
    details:{ quote:"Em nome da Lua, eu te puno!", emojis:["🌙","✨","💖"], bgColors:["#ec4899","#7e22ce"] }
  },
  { id:"vegeta", name:"Vegeta", image:"public/characters/vegeta.png", color:"#f87171", rarity:"epic", price:150,
    power:{ name:"Final Flash", desc:"Triplica XP no proximo acerto", icon:"💥", type:"xp_triplo", color:"#14b8a6" },
    passive:{ name:"Príncipe Sayajin", desc:"+15% XP em todas as fontes" },
    details:{ quote:"Eu sou o Principe dos Sayajins!", emojis:["💥","👑","🔥"], bgColors:["#14b8a6","#0f766e"] }
  },
  { id:"itachi", name:"Itachi", image:"public/characters/itachi.png", color:"#f87171", rarity:"mythic", price:150,
    power:{ name:"Tsukuyomi", desc:"Revela a resposta certa por 3s", icon:"🔮", type:"revelar_tempo", color:"#f87171" },
    passive:{ name:"Sharingan", desc:"Uma opcao errada e eliminada automaticamente" },
    details:{ quote:"Perdoe-me, Sasuke...", emojis:["🐦‍⬛","🔮","🍃"], bgColors:["#f87171","#1a1a1a"] }
  },
  { id:"meliodas", name:"Meliodas", image:"public/characters/meliodas.png", color:"#fbbf24", rarity:"mythic", price:150,
    power:{ name:"Full Counter", desc:"Chance de refletir o dano e nao perder vida ao errar", icon:"🛡️", type:"refletir_dano", color:"#fbbf24" },
    passive:{ name:"Pacto com o Demônio", desc:"+20% de dano critico" },
    details:{ quote:"Eu sou o Rei dos Piratas!", emojis:["☠️","🍖","🏴‍☠️"], bgColors:["#f87171","#fbbf24"] }
  }
];

const CHARACTERS_MAP = {};
for (const c of CHARACTERS) { CHARACTERS_MAP[c.id] = c; }

// ===== CHARACTER DETAIL =====
function mostrarDetalhePersonagem(id) {
    const char = CHARACTERS_MAP[id];
    const poder = poderesDisponiveis[id];
    if (!char) return;

    const overlay = document.getElementById('charDetailOverlay');
    const modal = document.getElementById('charDetailModal');
    if (!overlay || !modal) return;

    const imgEl = document.getElementById('charDetailImg');
    if (imgEl) { imgEl.src = char.image; imgEl.alt = char.name; }

    document.getElementById('charDetailNome').innerText = char.name;
    document.getElementById('charDetailPoder').innerHTML = (poder ? poder.icone + ' ' + poder.nome + ' — ' + poder.desc : 'Nenhum');
    document.getElementById('charDetailPassiva').innerText = char.passive ? char.passive.desc : 'Nenhuma';

    const quoteEl = document.getElementById('charDetailQuote');
    if (char.details && char.details.quote) {
        quoteEl.innerText = '"' + char.details.quote + '"';
        quoteEl.style.display = 'block';
    } else {
        quoteEl.style.display = 'none';
    }

    const cores = (char.details && char.details.bgColors) || ['#a855f7', '#4a1d6e'];
    const glowCor = cores[0];
    modal.style.background = 'linear-gradient(135deg, ' + cores[0] + '22, ' + cores[1] + '44)';
    modal.style.borderColor = cores[0];
    modal.style.boxShadow = '0 0 30px ' + glowCor + '33, inset 0 0 30px ' + glowCor + '11';

    const bgEl = document.getElementById('charDetailBgEmojis');
    if (bgEl) {
        bgEl.innerHTML = '';
        const emojis = (char.details && char.details.emojis) || ['⭐', '✨', '💫'];
        for (let i = 0; i < 12; i++) {
            const span = document.createElement('span');
            span.className = 'char-detail-float';
            span.innerText = emojis[i % emojis.length];
            span.style.left = (Math.random() * 90 + 5) + '%';
            span.style.animationDelay = (Math.random() * 8) + 's';
            span.style.fontSize = (Math.random() * 14 + 10) + 'px';
            span.style.opacity = 0.15 + Math.random() * 0.25;
            bgEl.appendChild(span);
        }
    }

    overlay.classList.add('ativo');
    modal.classList.add('ativo');
}

function fecharDetalhePersonagem() {
    const overlay = document.getElementById('charDetailOverlay');
    const modal = document.getElementById('charDetailModal');
    if (overlay) overlay.classList.remove('ativo');
    if (modal) modal.classList.remove('ativo');
}

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('charDetailOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) fecharDetalhePersonagem();
        });
    }
});

// ===== USER SYSTEM =====
let user = null;

function xpParaProximoNivel(nivel) {
    if (nivel >= NIVEL_MAX) return 0;
    return Math.floor(XP_NIVEL_BASE * Math.pow(FATOR_NIVEL, nivel - 1));
}

function carregarUser() {
    const saved = localStorage.getItem('quizMastersUser');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            user = {
                nivel: parsed.nivel || 1,
                xp: parsed.xp || 0,
                xpProximoNivel: xpParaProximoNivel(parsed.nivel || 1),
                moedas: parsed.moedas || 0,
                streak: parsed.streak || 0,
                maxStreak: parsed.maxStreak || 0,
                totalAcertos: parsed.totalAcertos || 0,
                totalPerguntas: parsed.totalPerguntas || 0,
                boostAtivo: parsed.boostAtivo || null,
                inventario: Object.assign({ personagens: [], ranks: [], posts: [], boosts: [], titulos: [] }, parsed.inventario || {}),
                equipado: Object.assign({ personagem: null, rank: null, post: null, titulo: null }, parsed.equipado || {}),
                perguntasRespondidas: parsed.perguntasRespondidas || {},
                conquistas: parsed.conquistas || [],
                generosJogados: parsed.generosJogados || [],
                poderesUsados: parsed.poderesUsados || []
            };
            generosJogados = user.generosJogados;
            if (user.nivel > NIVEL_MAX) user.nivel = NIVEL_MAX;
            user.xpProximoNivel = xpParaProximoNivel(user.nivel);
        } catch (e) {
            criarNovoUser();
        }
    } else {
        criarNovoUser();
    }
}

function criarNovoUser() {
    user = {
        nivel: 1, xp: 0, xpProximoNivel: xpParaProximoNivel(1),
        moedas: 0, streak: 0, maxStreak: 0,
        totalAcertos: 0, totalPerguntas: 0,
        boostAtivo: null,
        inventario: { personagens: [], ranks: [], posts: [], boosts: [], titulos: [] },
        equipado: { personagem: null, rank: null, post: null, titulo: null },
        perguntasRespondidas: {},
        conquistas: [],
        generosJogados: [],
        poderesUsados: []
    };
}

function salvarUser() {
    if (!user) return;
    const data = {
        nivel: user.nivel, xp: user.xp, moedas: user.moedas,
        streak: user.streak, maxStreak: user.maxStreak,
        totalAcertos: user.totalAcertos, totalPerguntas: user.totalPerguntas,
        boostAtivo: user.boostAtivo,
        inventario: user.inventario, equipado: user.equipado,
        perguntasRespondidas: user.perguntasRespondidas,
        conquistas: user.conquistas,
        generosJogados: user.generosJogados,
        poderesUsados: user.poderesUsados
    };
    localStorage.setItem('quizMastersUser', JSON.stringify(data));
}

function mostrarPopup(texto, tipo) {
    const container = document.getElementById('floatingPopups');
    if (!container) return;
    const popup = document.createElement('div');
    popup.className = 'floating-popup ' + (tipo || 'xp');
    popup.innerText = texto;
    container.appendChild(popup);
    setTimeout(() => popup.remove(), 1300);
}

function ganharXp(quantidade) {
    if (!user || quantidade <= 0) return;
    user.xp += quantidade;
    mostrarPopup('+' + quantidade + ' XP', 'xp');
    while (user.xp >= user.xpProximoNivel && user.nivel < NIVEL_MAX) {
        user.xp -= user.xpProximoNivel;
        user.nivel++;
        user.xpProximoNivel = xpParaProximoNivel(user.nivel);
        notificar('🎉 SUBIU DE NIVEL! Voce agora e nivel ' + user.nivel + '!', '#ffd700');
        if (user.nivel >= NIVEL_MAX) {
            user.xp = 0;
            user.xpProximoNivel = 0;
            break;
        }
    }
    if (user.nivel >= NIVEL_MAX) {
        user.xp = 0;
        user.xpProximoNivel = 0;
    }
    salvarUser();
}

function ganharMoedas(quantidade) {
    if (!user || quantidade <= 0) return;
    user.moedas += quantidade;
    mostrarPopup('+' + quantidade + ' 🪙', 'coin');
    salvarUser();
}

// ===== SHOP DATA =====
const lojaBoosts = [
    { id: 'boost_xp', nome: 'Multiplicador XP', desc: '+50% XP por 30s', preco: 80, icone: '⚡' },
    { id: 'boost_moedas', nome: 'Multiplicador Moedas', desc: '+50% moedas por 30s', preco: 60, icone: '🪙' },
    { id: 'boost_vida', nome: 'Vida Extra', desc: 'Comece com +1 vida', preco: 100, icone: '❤️' },
    { id: 'boost_2x', nome: '2X XP', desc: 'Dobra XP por 20s', preco: 150, icone: '🔥' },
    { id: 'boost_triplo', nome: '3X XP', desc: 'Triplica XP por 15s', preco: 250, icone: '💫' },
    { id: 'boost_dobro', nome: 'Moedas Dobradas', desc: '+100% moedas por 25s', preco: 120, icone: '💰' }
];

const lojaRanks = [
    { id: 'bronze', nome: 'Bronze', desc: 'Rank inicial', preco: 0, icone: '🥉', mult: 1.0, cor: '#cd7f32' },
    { id: 'prata', nome: 'Prata', desc: 'Rank intermediario', preco: 200, icone: '🥈', mult: 1.2, cor: '#c0c0c0' },
    { id: 'ouro', nome: 'Ouro', desc: 'Rank avancado', preco: 500, icone: '🥇', mult: 1.5, cor: '#ffd700' },
    { id: 'platina', nome: 'Platina', desc: 'Rank premium', preco: 800, icone: '💿', mult: 1.8, cor: '#e5e4e2' },
    { id: 'diamante', nome: 'Diamante', desc: 'Rank elite', preco: 1000, icone: '💎', mult: 2.0, cor: '#00bfff' },
    { id: 'esmeralda', nome: 'Esmeralda', desc: 'Rank mitico', preco: 1800, icone: '💚', mult: 2.5, cor: '#50c878' },
    { id: 'mestre', nome: 'Mestre', desc: 'Rank lendario', preco: 2500, icone: '👑', mult: 3.0, cor: '#a855f7' }
];

const lojaPosts = [
    { id: 'post_frase1', nome: 'Sabio', desc: 'O conhecimento e o unico tesouro que ninguem pode roubar.', preco: 50, icone: '📜' },
    { id: 'post_frase2', nome: 'Guerreiro', desc: 'Nao pare ate se orgulhar de si mesmo!', preco: 80, icone: '⚔️' },
    { id: 'post_frase3', nome: 'Mestre', desc: 'Quanto mais eu sei, mais eu percebo que nao sei.', preco: 120, icone: '🎓' },
    { id: 'post_frase4', nome: 'Lendario', desc: 'Nao ha atalhos para o conhecimento.', preco: 200, icone: '🏆' },
    { id: 'post_frase5', nome: 'Cosmico', desc: 'A mente e o limite. Literalmente.', preco: 500, icone: '🌌' },
    { id: 'post_frase6', nome: 'Fenix', desc: 'Das cinzas eu renasco mais forte.', preco: 150, icone: '🔥' },
    { id: 'post_frase7', nome: 'Andarilho', desc: 'A jornada e o destino.', preco: 100, icone: '🌄' },
    { id: 'post_frase8', nome: 'Dragao', desc: 'O medo e o inimigo interior.', preco: 250, icone: '🐉' },
    { id: 'post_frase9', nome: 'Templario', desc: 'Honra acima de tudo.', preco: 180, icone: '🛡️' },
    { id: 'post_frase10', nome: 'Estrategista', desc: 'Preveja o imprevisivel.', preco: 300, icone: '♟️' }
];

const lojaTitulos = [
    { id: 'sanguinario', nome: 'Sanguinario', desc: 'O sangue dos fracos molha suas maos', preco: 150, icone: '🩸', cor: '#cc0000' },
    { id: 'justiceiro', nome: 'Justiceiro', desc: 'A justica vem com ferrugem e fio', preco: 200, icone: '⚔️', cor: '#8b0000' },
    { id: 'cacador_almas', nome: 'Cacador de Almas', desc: 'Colecionador de espiritos errantes', preco: 300, icone: '💀', cor: '#4a0000' },
    { id: 'lamina_negra', nome: 'Lamina Negra', desc: 'O corte que nao se ve chegando', preco: 250, icone: '🗡️', cor: '#1a0000' },
    { id: 'executor', nome: 'Executor', desc: 'Sem piedade, sem arrependimento', preco: 180, icone: '🔪', cor: '#cc0000' },
    { id: 'espectro', nome: 'Espectro', desc: 'Nem vivo, nem morto', preco: 350, icone: '👻', cor: '#2d004d' },
    { id: 'berserker', nome: 'Berserker', desc: 'A furia e a unica lingua que conhece', preco: 220, icone: '🩹', cor: '#8b0000' },
    { id: 'ceifador', nome: 'Ceifador', desc: 'A hora de todos chega', preco: 400, icone: '🦴', cor: '#1a0000' },
    { id: 'templario_negro', nome: 'Templario Negro', desc: 'Fe quebrada, juramento manchado', preco: 500, icone: '🛡️', cor: '#2d0000' },
    { id: 'vampiro', nome: 'Vampiro', desc: 'A noite e sua aliada eterna', preco: 280, icone: '🧛', cor: '#4a0000' },
    { id: 'fera', nome: 'Fera', desc: 'Instinto acima da razao', preco: 160, icone: '🐺', cor: '#8b0000' },
    { id: 'demonio', nome: 'Demonio', desc: 'O pacto foi feito ha muito tempo', preco: 600, icone: '👿', cor: '#8b0000' },
    { id: 'lobo_solitario', nome: 'Lobo Solitario', desc: 'Nenhuma alcateia, apenas a cacada', preco: 190, icone: '🐺', cor: '#3a0000' },
    { id: 'flagelo', nome: 'Flagelo', desc: 'O castigo que assombra os fracos', preco: 320, icone: '⛓️', cor: '#5a0000' },
    { id: 'abissal', nome: 'Abissal', desc: 'Do abismo, o poder infinito', preco: 450, icone: '🌑', cor: '#0a001a' },
];

// ===== QUIZ FUNCTIONS =====
function embaralhar(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function renderizarGeneros() {
    const grid = document.getElementById('generoGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (const [id, g] of Object.entries(generos)) {
        if (id === 'todos') continue;
        const btn = document.createElement('button');
        btn.className = 'genero-btn';
        btn.onclick = () => iniciarQuiz(id);
        btn.innerHTML = '<span class="genero-icone">' + g.icone + '</span><span class="genero-nome">' + g.nome + '</span><span class="genero-desc">' + g.desc + '</span>';
        grid.appendChild(btn);
    }
    if (generos.todos) {
        const btnTodos = document.createElement('button');
        btnTodos.className = 'genero-btn destaque';
        btnTodos.onclick = () => iniciarQuiz('todos');
        btnTodos.innerHTML = '<span class="genero-icone">' + generos.todos.icone + '</span><span class="genero-nome">' + generos.todos.nome + '</span><span class="genero-desc">' + generos.todos.desc + '</span>';
        grid.appendChild(btnTodos);
    }
}

function iniciarQuiz(genero) {
    generoAtual = genero;
    if (!user.generosJogados.includes(genero)) {
        user.generosJogados.push(genero);
        generosJogados = user.generosJogados;
        salvarUser();
    }
    
    const gen = generos[genero];
    if (!gen) return;
    
    const todas = gen.perguntas;
    const idsRespondidos = (user.perguntasRespondidas[genero] || []);
    
    let disponiveis = todas.filter((_, idx) => !idsRespondidos.includes(idx));
    
    if (disponiveis.length < 5) {
        user.perguntasRespondidas[genero] = [];
        disponiveis = [...todas];
        salvarUser();
        notificar('🔄 Todas as perguntas de ' + gen.nome + ' foram recicladas!', '#ffd700');
    }
    
    perguntas = embaralhar(disponiveis).slice(0, Math.min(20, disponiveis.length));
    if (perguntas.length < 5) { perguntas = embaralhar(disponiveis).slice(0, 5); }
    
    perguntaAtual = 0;
    pontuacao = 0;
    vidas = 3 + getBoostVidaExtra();
    perguntaRespondida = false;
    quizAtivo = true;
    poderUsado = false;
    poderEfeito = null;
    poderUsosRestantes = getMaxPoderUsos();
    pararTimer();
    aplicarPassivaInicioQuiz();

    document.getElementById('generoSelecao').style.display = 'none';
    document.getElementById('quizContainer').style.display = 'block';
    atualizarVidas();
    atualizarHUD();
    exibirPergunta();
}

function exibirPergunta() {
    if (!quizAtivo || perguntas.length === 0) return;
    const total = perguntas.length;
    const item = perguntas[perguntaAtual];

    const badge = document.getElementById('generoBadge');
    if (badge && item.cat) {
        const gen = generos[item.cat];
        if (gen) {
            badge.innerHTML = gen.icone + ' ' + gen.nome;
            badge.style.display = 'inline-block';
            badge.style.borderColor = gen.cor;
            badge.style.color = gen.cor;
        }
    }

    const diffEl = document.getElementById('dificuldadeBadge');
    if (diffEl) {
        const diffNomes = { facil: 'Facil', medio: 'Medio', dificil: 'Dificil' };
        const diffCores = { facil: '#4ade80', medio: '#fbbf24', dificil: '#f87171' };
        const diffIcones = { facil: '🟢', medio: '🟡', dificil: '🔴' };
        diffEl.innerHTML = (diffIcones[item.dificuldade] || '🟢') + ' ' + (diffNomes[item.dificuldade] || 'Facil');
        diffEl.style.color = diffCores[item.dificuldade] || '#4ade80';
        diffEl.style.display = 'inline-block';
    }

    document.getElementById('pergunta').innerText = item.pergunta;
    document.getElementById('contador').innerText = 'Questao ' + (perguntaAtual + 1) + ' de ' + total;
    document.getElementById('pontuacaoParcial').innerText = 'Acertos: ' + pontuacao;

    const barra = document.getElementById('progresso');
    barra.style.width = ((perguntaAtual + 1) / total) * 100 + '%';

    const divOpcoes = document.getElementById('opcoes');
    divOpcoes.innerHTML = '';
    document.getElementById('btnProximo').style.display = 'none';
    document.getElementById('resultado').innerText = '';
    const poderContainer = document.getElementById('poderContainer');
    if (poderContainer) poderContainer.remove();
    perguntaRespondida = false;
    tempoResposta = 0;

    const personId = user.equipado.personagem;
    if (personId && poderesDisponiveis[personId] && poderUsosRestantes > 0) {
        const poder = poderesDisponiveis[personId];
        const container = document.createElement('div');
        container.id = 'poderContainer';
        container.style.cssText = 'text-align:center;margin-top:16px;';
        const usosTexto = poderUsosRestantes > 1 ? ' (' + poderUsosRestantes + 'x)' : '';
        container.innerHTML = '<button onclick="usarPoder()" class="btn-poder" id="btnPoder">' + poder.icone + ' ' + poder.nome + usosTexto + '</button>';
        divOpcoes.parentNode.insertBefore(container, divOpcoes.nextSibling);
    }

    item.opcoes.forEach((opcao, index) => {
        const btn = document.createElement('button');
        btn.innerText = opcao;
        btn.classList.add('opcao');
        btn.onclick = () => verificarResposta(index);
        divOpcoes.appendChild(btn);
    });

    if (personId === 'itachi') {
        const opcoesBtns = divOpcoes.querySelectorAll('.opcao');
        if (opcoesBtns.length > 1) {
            const erradas = [];
            for (let i = 0; i < item.opcoes.length; i++) {
                if (i !== item.correta) erradas.push(i);
            }
            const eliminar = erradas[Math.floor(Math.random() * erradas.length)];
            opcoesBtns[eliminar].classList.add('eliminada');
            opcoesBtns[eliminar].disabled = true;
        }
    }

    iniciarTimer(item.dificuldade || 'facil');
}

function verificarResposta(selecionada) {
    if (perguntaRespondida || !quizAtivo) return;
    perguntaRespondida = true;
    pararTimer();
    
    const item = perguntas[perguntaAtual];
    const correta = item.correta;
    const res = document.getElementById('resultado');
    const botoes = document.querySelectorAll('.opcao');

    user.totalPerguntas++;
    botoes.forEach((b, i) => {
        b.disabled = true;
        if (i === correta) b.classList.add('correta');
        else if (i === selecionada && selecionada !== correta) b.classList.add('errada');
    });

    if (tempoResposta <= 3 && selecionada === correta) {
        user.conquistas = user.conquistas || [];
        if (!user.conquistas.includes('rapido')) {
            user.conquistas.push('rapido');
            notificar('🏆 Conquista: Relampago! Responda em menos de 3s', '#ffd700');
            ganharXp(100);
        }
    }

    const genId = item.cat;
    if (!user.perguntasRespondidas[genId]) user.perguntasRespondidas[genId] = [];
    const gen = generos[genId];
    if (gen) {
        const originalIdx = gen.perguntas.indexOf(item);
        if (originalIdx !== -1 && !user.perguntasRespondidas[genId].includes(originalIdx)) {
            user.perguntasRespondidas[genId].push(originalIdx);
        }
    }

    const multDificuldade = MULT_DIFICULDADE[item.dificuldade] || 1;

    if (selecionada === correta) {
        res.innerText = 'Correto!';
        res.style.color = '#4ade80';
        pontuacao++;
        user.totalAcertos++;
        user.streak++;
        if (user.streak > user.maxStreak) user.maxStreak = user.streak;
        const rankMult = getRankMultiplicador();
        const bonusStreak = Math.min(user.streak, BONUS_STREAK_MAX);
        let xpGanho = Math.floor((XP_BASE + (bonusStreak * 2)) * multDificuldade * rankMult);
        let moedasGanho = Math.floor((MOEDAS_ACERTO + Math.floor(bonusStreak / 2)) * rankMult);
        
        const tempoMax = TEMPO_POR_DIFICULDADE[item.dificuldade] || 20;
        const tempoUsado = Math.min(tempoResposta, tempoMax);
        const speedBonus = Math.floor((1 - tempoUsado / tempoMax) * 0.5 * xpGanho);
        if (speedBonus > 0) {
            xpGanho += speedBonus;
            mostrarPopup('+' + speedBonus + ' bonus velocidade!', 'xp');
        }
        
        if (poderEfeito === 'xp_bonus') { xpGanho += 50; poderEfeito = null; }
        if (poderEfeito === 'moedas_dobradas') { moedasGanho *= 2; poderEfeito = null; }
        if (poderEfeito === 'xp_triplo') { xpGanho *= 3; poderEfeito = null; }
        xpGanho = Math.floor(xpGanho * getBoostMultiplicadorXP());
        moedasGanho = Math.floor(moedasGanho * getBoostMultiplicadorMoedas());
        xpGanho = aplicarBonusPassivaXP(xpGanho);
        moedasGanho = aplicarBonusPassivaMoedas(moedasGanho);
        ganharXp(xpGanho);
        ganharMoedas(moedasGanho);
        document.getElementById('btnProximo').style.display = 'inline-block';
    } else {
        res.innerText = 'Errado! Resposta: ' + item.opcoes[correta];
        res.style.color = '#f87171';
        user.streak = 0;
        ganharMoedas(MOEDAS_ERRO);
        perderVida();
        document.getElementById('btnProximo').style.display = 'inline-block';
    }

    verificarConquistas();
    atualizarHUD();
    salvarUser();
}

function perderVida() {
    if (getChanceSalvarVida()) {
        notificar('🍃 Folego Constante! Vida salva!', '#4ade80');
        return;
    }
    if (poderEfeito === 'refletir_dano') {
        poderEfeito = null;
        notificar('🛡️ Full Counter! Dano refletido!', '#fbbf24');
        animarPoderPersonagem(user.equipado.personagem);
        return;
    }
    if (getChanceRefletirDano()) {
        notificar('🛡️ Pacto com o Demonio! Dano refletido!', '#fbbf24');
        return;
    }
    vidas--;
    atualizarVidas();
    if (vidas <= 0) {
        mostrarGameOver();
    }
}

function atualizarVidas() {
    const maxVidas = 5;
    for (let i = 1; i <= maxVidas; i++) {
        const el = document.getElementById('vida' + i);
        if (!el) continue;
        if (i <= vidas) {
            el.className = 'vida';
            el.style.display = 'inline';
        } else {
            el.className = 'vida perdida';
            el.style.display = i > 3 ? 'none' : 'inline';
        }
    }
}

function mostrarGameOver() {
    quizAtivo = false;
    pararTimer();
    const overlay = document.getElementById('gameOverOverlay');
    const msg = document.getElementById('gameoverMsg');
    const acertos = document.getElementById('gameoverAcertos');
    const total = perguntas.length;
    msg.innerText = 'Voce perdeu todas as vidas!';
    acertos.innerText = 'Acertos: ' + pontuacao + '/' + total;
    overlay.classList.add('ativo');
}

function fecharGameOver() {
    document.getElementById('gameOverOverlay').classList.remove('ativo');
    finalizarQuiz();
}

function proximaPergunta() {
    if (!quizAtivo) return;
    perguntaAtual++;
    if (perguntaAtual >= perguntas.length) {
        finalizarQuiz();
    } else {
        exibirPergunta();
    }
}

function finalizarQuiz() {
    quizAtivo = false;
    poderUsado = false;
    poderEfeito = null;
    pararTimer();
    const total = perguntas.length;
    const pct = total > 0 ? Math.round((pontuacao / total) * 100) : 0;

    const titulos = {
        perfeito: { texto: '⭐ PERFEITO! ⭐', cor: '#ffd700', emoji: '🏆' },
        excelente: { texto: '🎉 Excelente!', cor: '#4ade80', emoji: '🔥' },
        bom: { texto: '👏 Bom trabalho!', cor: '#3b82f6', emoji: '💪' },
        treinar: { texto: '💀 Continue treinando!', cor: '#f87171', emoji: '📚' }
    };
    let titulo = pct >= 100 ? titulos.perfeito : pct >= 70 ? titulos.excelente : pct >= 40 ? titulos.bom : titulos.treinar;

    const xpBase = Math.floor(pontuacao * 10 * (pct / 100));
    const moedasGanhas = pontuacao * 3 + Math.floor(pontuacao / 5) * 2;

    document.getElementById('quizContainer').innerHTML =
        '<div class="fim-card">' +
            '<div class="fim-glow" style="background:' + titulo.cor + '"></div>' +
            '<h2 class="fim-titulo" style="color:' + titulo.cor + '">' + titulo.texto + '</h2>' +
            '<div class="fim-pontuacao">' + pontuacao + '/' + total + '</div>' +
            '<div class="fim-pct" style="color:' + titulo.cor + '">' + pct + '% de acerto</div>' +
            '<div class="fim-stats">' +
                '<div class="fim-stat"><span class="fim-stat-num">+' + xpBase + '</span><span class="fim-stat-label">XP</span></div>' +
                '<div class="fim-stat"><span class="fim-stat-num">+' + moedasGanhas + '</span><span class="fim-stat-label">Moedas</span></div>' +
                '<div class="fim-stat"><span class="fim-stat-num">' + user.streak + '</span><span class="fim-stat-label">Streak</span></div>' +
                '<div class="fim-stat"><span class="fim-stat-num">' + user.totalAcertos + '</span><span class="fim-stat-label">Total Acertos</span></div>' +
            '</div>' +
            '<button onclick="resetarQuiz()" class="btn-reiniciar" style="--btn-cor:' + titulo.cor + '">Jogar Novamente</button>' +
        '</div>';

    ganharXp(xpBase);
    ganharMoedas(moedasGanhas);

    if (pct >= 100) {
        user.conquistas = user.conquistas || [];
        if (!user.conquistas.includes('perfeito')) {
            user.conquistas.push('perfeito');
            notificar('🏆 Conquista: PERFEITO! 100% de acerto!', '#ffd700');
            ganharXp(200);
        }
        setTimeout(() => iniciarCelebracao('perfeito'), 300);
    } else if (pct >= 70) {
        setTimeout(() => iniciarCelebracao('excelente'), 300);
    } else if (pct >= 40) {
        setTimeout(() => iniciarCelebracao('bom'), 300);
    }

    verificarConquistas();
    salvarUser();
}

function sairDoQuiz() {
    if (quizAtivo && !confirm('Tem certeza que deseja sair? Seu progresso neste quiz sera perdido.')) return;
    resetarQuiz();
}

function resetarQuiz() {
    const innerHTML = '<div class="quiz-topo"><button onclick="sairDoQuiz()" class="btn-voltar">⬅ Voltar</button><h1>🎮 Quiz Masters</h1></div>' +
        '<div class="barra-progresso"><div id="progresso"></div></div>' +
        '<div class="quiz-badges">' +
            '<span id="generoBadge" class="genero-badge" style="display:none"></span>' +
            '<span id="dificuldadeBadge" class="dificuldade-badge" style="display:none"></span>' +
        '</div>' +
        '<div id="timerContainer" class="timer-container" style="display:none">' +
            '<div id="timerBar" class="timer-bar"></div>' +
            '<span id="timerTexto" class="timer-texto"></span>' +
        '</div>' +
        '<div class="header-info">' +
            '<span id="contador">Questao 1 de 20</span>' +
            '<span id="pontuacaoParcial">Acertos: 0</span>' +
        '</div>' +
        '<p id="pergunta"></p>' +
        '<div id="opcoes"></div>' +
        '<p id="resultado"></p>' +
        '<button onclick="proximaPergunta()" id="btnProximo">Proxima ➜</button>';
    document.getElementById('quizContainer').innerHTML = innerHTML;
    quizAtivo = false;
    poderUsado = false;
    poderEfeito = null;
    pararTimer();
    document.getElementById('generoSelecao').style.display = 'block';
    document.getElementById('quizContainer').style.display = 'none';
    mostrarAba('Quiz');
    vidas = 3;
    atualizarVidas();
    renderizarGeneros();
}

// ===== TIMER SYSTEM =====
function iniciarTimer(dificuldade) {
    pararTimer();
    const tempoTotal = (TEMPO_POR_DIFICULDADE[dificuldade] || 20) + getTimerBonusPassiva();
    tempoRestante = tempoTotal;
    tempoResposta = 0;
    
    const timerContainer = document.getElementById('timerContainer');
    const timerBar = document.getElementById('timerBar');
    const timerTexto = document.getElementById('timerTexto');
    
    if (!timerBar || !timerTexto) return;
    
    timerContainer.style.display = 'flex';
    timerBar.style.width = '100%';
    timerBar.style.background = 'linear-gradient(90deg, #4ade80, #fbbf24)';
    timerTexto.innerText = tempoTotal + 's';
    
    const startTime = Date.now();
    timerInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(0, tempoTotal - elapsed);
        tempoRestante = Math.ceil(remaining);
        tempoResposta = elapsed;
        
        const pct = (remaining / tempoTotal) * 100;
        timerBar.style.width = pct + '%';
        timerTexto.innerText = Math.ceil(remaining) + 's';
        
        if (pct < 30) timerBar.style.background = 'linear-gradient(90deg, #f87171, #ef4444)';
        else if (pct < 60) timerBar.style.background = 'linear-gradient(90deg, #fbbf24, #f59e0b)';
        
        if (remaining <= 0) {
            pararTimer();
            if (!perguntaRespondida && quizAtivo) {
                const botoes = document.querySelectorAll('.opcao');
                botoes.forEach(b => b.disabled = true);
                const item = perguntas[perguntaAtual];
                if (item) {
                    botoes.forEach((b, i) => { if (i === item.correta) b.classList.add('correta'); });
                    document.getElementById('resultado').innerText = 'Tempo esgotado! Resposta: ' + item.opcoes[item.correta];
                    document.getElementById('resultado').style.color = '#f87171';
                }
                document.getElementById('btnProximo').style.display = 'inline-block';
                user.totalPerguntas++;
                user.streak = 0;
                ganharMoedas(MOEDAS_ERRO);
                perguntaRespondida = true;
                perderVida();
                atualizarHUD();
                salvarUser();
            }
        }
    }, 100);
}

function pararTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    const timerContainer = document.getElementById('timerContainer');
    const timerBar = document.getElementById('timerBar');
    if (timerContainer) timerContainer.style.display = 'none';
    if (timerBar) timerBar.style.width = '0%';
}

// ===== ACHIEVEMENT SYSTEM =====
function verificarConquistas() {
    user.conquistas = user.conquistas || [];
    conquistas.forEach(c => {
        if (c.especial) return;
        if (user.conquistas.includes(c.id)) return;
        if (c.condicao(user)) {
            user.conquistas.push(c.id);
            notificar('🏆 Conquista: ' + c.nome + '! ' + c.desc, '#ffd700');
            ganharXp(c.recompensaXP);
        }
    });
    const generosSemTodos = Object.keys(generos).filter(g => g !== 'todos');
    const generosJogadosSemTodos = generosJogados.filter(g => g !== 'todos');
    if (!user.conquistas.includes('todos_generos') && generosJogadosSemTodos.length >= generosSemTodos.length) {
        user.conquistas.push('todos_generos');
        notificar('🏆 Conquista: Explorador! Jogou em todos os generos!', '#ffd700');
        ganharXp(500);
    }
}

// ===== POWER SYSTEM =====
function usarPoder() {
    if (!quizAtivo || perguntaRespondida || poderUsosRestantes <= 0) return;
    const personId = user.equipado.personagem;
    if (!personId || !poderesDisponiveis[personId]) return;
    const poder = poderesDisponiveis[personId];
    poderUsosRestantes--;
    const btn = document.getElementById('btnPoder');
    if (btn) btn.disabled = poderUsosRestantes <= 0;

    if (!user.poderesUsados.includes(personId)) {
        user.poderesUsados.push(personId);
        if (!user.conquistas.includes('poder_usado')) {
            user.conquistas.push('poder_usado');
            notificar('🏆 Conquista: Poderoso! Usou um poder pela primeira vez!', '#ffd700');
            ganharXp(100);
        }
        if (user.poderesUsados.length >= Object.keys(poderesDisponiveis).length && !user.conquistas.includes('todos_poderes')) {
            user.conquistas.push('todos_poderes');
            notificar('🏆 Conquista: Colecionador de Poderes! Usou todos os poderes!', '#ffd700');
            ganharXp(2000);
        }
        salvarUser();
    }

    const item = perguntas[perguntaAtual];
    const botoes = document.querySelectorAll('.opcao');

    const corExplosao = poder.cor || '#9b59b6';

    switch (poder.tipo) {
        case 'xp_bonus':
            poderEfeito = 'xp_bonus';
            animarPoderPersonagem(personId);
            notificar('🍃 Modo Sabio ativado! +50 XP no proximo acerto!', '#f7971e');
            break;

        case 'eliminar_opcoes': {
            let eliminadas = 0;
            const indices = [];
            for (let i = 0; i < item.opcoes.length; i++) {
                if (i !== item.correta) indices.push(i);
            }
            embaralhar(indices);
            const alvos = indices.slice(0, 2);
            alvos.forEach(i => {
                botoes[i].classList.add('eliminada');
                botoes[i].disabled = true;
                eliminadas++;
            });
            animarPoderPersonagem(personId);
            notificar('⚡ Kamehameha! 2 opcoes erradas foram eliminadas!', '#3b82f6');
            break;
        }

        case 'pular_questao':
            pararTimer();
            perguntaRespondida = true;
            pontuacao++;
            user.totalAcertos++;
            user.totalPerguntas++;
            if (!user.perguntasRespondidas[item.cat]) user.perguntasRespondidas[item.cat] = [];
            const genPular = generos[item.cat];
            if (genPular) {
                const origIdxPular = genPular.perguntas.indexOf(item);
                if (origIdxPular !== -1 && !user.perguntasRespondidas[item.cat].includes(origIdxPular)) {
                    user.perguntasRespondidas[item.cat].push(origIdxPular);
                }
            }
            botoes.forEach(b => b.disabled = true);
            botoes[item.correta].classList.add('correta');
            animarPoderPersonagem(personId);
            notificar('🪨 Gomu Gomu! Questao destruida automaticamente!', '#ef4444');
            document.getElementById('resultado').innerText = 'Gomu Gomu no Pistol!';
            document.getElementById('resultado').style.color = '#ef4444';
            document.getElementById('btnProximo').style.display = 'inline-block';
            break;

        case 'revelar_resposta': {
            animarPoderPersonagem(personId);
            notificar('⚡ Choque do Trovao! Resposta revelada por 2s!', '#9b59b6');
            botoes[item.correta].classList.add('revelada');
            setTimeout(() => {
                botoes[item.correta].classList.remove('revelada');
            }, 2000);
            break;
        }

        case 'curar_vida':
            animarPoderPersonagem(personId);
            if (vidas < 3) {
                vidas++;
                atualizarVidas();
                notificar('🌊 Respiracao da Agua! Vida recuperada!', '#9b59b6');
            } else {
                notificar('🌊 Respiracao da Agua! Voce ja esta com todas as vidas!', '#9b59b6');
                poderUsado = false;
                if (btn) btn.disabled = false;
            }
            break;

        case 'passar_questao':
            pararTimer();
            perguntaRespondida = true;
            pontuacao++;
            user.totalAcertos++;
            user.totalPerguntas++;
            if (!user.perguntasRespondidas[item.cat]) user.perguntasRespondidas[item.cat] = [];
            const genPass = generos[item.cat];
            if (genPass) {
                const origIdxPass = genPass.perguntas.indexOf(item);
                if (origIdxPass !== -1 && !user.perguntasRespondidas[item.cat].includes(origIdxPass)) {
                    user.perguntasRespondidas[item.cat].push(origIdxPass);
                }
            }
            botoes.forEach(b => b.disabled = true);
            botoes[item.correta].classList.add('correta');
            animarPoderPersonagem(personId);
            notificar('💜 Hollow Purple! Questao passada automaticamente!', '#9b59b6');
            document.getElementById('resultado').innerText = 'Passada com Hollow Purple!';
            document.getElementById('resultado').style.color = '#9b59b6';
            document.getElementById('btnProximo').style.display = 'inline-block';
            break;

        case 'moedas_dobradas':
            poderEfeito = 'moedas_dobradas';
            animarPoderPersonagem(personId);
            notificar('🗡️ Laminas Titanicas! Moedas dobradas no proximo acerto!', '#9b59b6');
            break;

        case 'curar_tudo':
            vidas = 3;
            atualizarVidas();
            animarPoderPersonagem(personId);
            notificar('🌙 Moon Healing! Todas as vidas restauradas!', '#9b59b6');
            break;

        case 'xp_triplo':
            poderEfeito = 'xp_triplo';
            animarPoderPersonagem(personId);
            notificar('💥 Final Flash! XP triplicado no proximo acerto!', '#14b8a6');
            break;

        case 'revelar_tempo': {
            animarPoderPersonagem(personId);
            notificar('🔮 Tsukuyomi! Resposta revelada por 3s!', '#f87171');
            botoes[item.correta].classList.add('revelada');
            setTimeout(() => {
                botoes[item.correta].classList.remove('revelada');
            }, 3000);
            break;
        }

        case 'refletir_dano':
            poderEfeito = 'refletir_dano';
            animarPoderPersonagem(personId);
            notificar('🛡️ Full Counter! Dano refletido no proximo erro!', '#fbbf24');
            break;

        default:
            notificar('Poder desconhecido!', '#f87171');
            poderUsado = false;
            if (btn) btn.disabled = false;
    }
}

function getRankMultiplicador() {
    const rankId = user.equipado.rank;
    if (!rankId) return 1;
    const rank = lojaRanks.find(r => r.id === rankId);
    return rank ? rank.mult : 1;
}

// ===== ANIMATION =====
function iniciarCelebracao(tipo) {
    const canvas = document.getElementById('animacaoCanvas');
    if (!canvas) return;
    canvas.classList.add('ativo');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const configs = {
        perfeito: { qtd: 250, duracao: 5000, texto: '⭐ PERFEITO! ⭐', corTexto: '#ffd700', explosao: true },
        excelente: { qtd: 120, duracao: 3500, texto: '🎉 EXCELENTE! 🎉', corTexto: '#4ade80', explosao: true },
        bom: { qtd: 60, duracao: 2500, texto: '👏 BOM TRABALHO! 👏', corTexto: '#3b82f6', explosao: false }
    };
    const cfg = configs[tipo] || configs.bom;

    const cores = ['#ffd700', '#f7971e', '#ff6b6b', '#4ade80', '#3b82f6', '#ec4899', '#a855f7', '#14b8a6', '#fff', '#fbbf24'];
    const formas = ['rect', 'circle', 'star'];
    const particles = [];
    const duracao = cfg.duracao;
    const start = Date.now();

    function criarParticula(x, y, explosao) {
        const angle = explosao ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        const speed = explosao ? Math.random() * 12 + 4 : Math.random() * 6 + 2;
        return {
            x: x || Math.random() * canvas.width,
            y: y || canvas.height + 30,
            vx: Math.cos(angle) * speed * (explosao ? 1 : (Math.random() * 0.5 + 0.5)),
            vy: Math.sin(angle) * speed * (explosao ? 1 : -(Math.random() * 0.5 + 0.5)),
            size: Math.random() * 7 + 2,
            cor: cores[Math.floor(Math.random() * cores.length)],
            forma: formas[Math.floor(Math.random() * formas.length)],
            rot: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 0.3,
            gravidade: explosao ? 0.08 : 0.05,
        };
    }

    for (let i = 0; i < cfg.qtd; i++) {
        particles.push(criarParticula(null, null, false));
    }

    if (cfg.explosao) {
        for (let i = 0; i < cfg.qtd * 0.4; i++) {
            setTimeout(() => {
                particles.push(criarParticula(
                    Math.random() * canvas.width * 0.6 + canvas.width * 0.2,
                    Math.random() * canvas.height * 0.4 + canvas.height * 0.2,
                    true
                ));
            }, Math.random() * cfg.duracao * 0.5);
        }
    }

    function desenharParticula(p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = p.cor;
        ctx.shadowColor = p.cor;
        ctx.shadowBlur = p.size * 2;

        const s = p.size;
        if (p.forma === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.forma === 'star') {
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * s / 2, Math.sin(a) * s / 2);
            }
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(-s / 2, -s / 2, s, s);
        }
        ctx.restore();
    }

    function animar() {
        const elapsed = Date.now() - start;
        if (elapsed > duracao) {
            canvas.classList.remove('ativo');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const alpha = elapsed < 300 ? elapsed / 300 : 1;

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravidade;
            p.vx *= 0.99;
            p.rot += p.rotV;

            if (p.y > canvas.height + 50) {
                p.y = canvas.height + 30;
                p.x = Math.random() * canvas.width;
                p.vy = -(Math.random() * 6 + 3);
            }
            if (p.x < -50) p.x = canvas.width + 20;
            if (p.x > canvas.width + 50) p.x = -20;

            desenharParticula(p);
        });

        if (cfg.texto) {
            ctx.save();
            ctx.globalAlpha = alpha * 0.85;
            ctx.fillStyle = cfg.corTexto;
            ctx.font = 'bold 52px Segoe UI';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = cfg.corTexto;
            ctx.shadowBlur = 40;
            const pulseScale = 1 + Math.sin(elapsed * 0.003) * 0.05;
            ctx.setTransform(pulseScale, 0, 0, pulseScale, canvas.width / 2, canvas.height / 2);
            ctx.fillText(cfg.texto, 0, 0);
            ctx.restore();
        }

        requestAnimationFrame(animar);
    }

    animar();
}

// ===== POWER ANIMATION =====
function animarPoderPersonagem(personagemId) {
    const canvas = document.getElementById('animacaoCanvas');
    if (!canvas) return;
    canvas.classList.add('ativo');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const widget = document.getElementById('charWidget');
    let startX = 120, startY = canvas.height / 2;
    if (widget) {
        const rect = widget.getBoundingClientRect();
        startX = rect.right;
        startY = rect.top + rect.height / 2;
    }
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const item = perguntas[perguntaAtual];
    const botoes = document.querySelectorAll('.opcao');
    const opcoesEl = document.getElementById('opcoes');
    let opcoesRect = null;
    if (opcoesEl) opcoesRect = opcoesEl.getBoundingClientRect();
    const charDurations = { naruto: 4000, goku: 4000, luffy: 2500, pikachu: 2500, tanjiro: 2500, gojo: 3800, mikasa: 2500, sailor: 2500, vegeta: 4000, itachi: 2800, meliodas: 3800 };
    const duracao = charDurations[personagemId] || 2500;
    const start = Date.now();


    function drawCircle(x, y, r, cor, blur) {
        ctx.save();
        ctx.fillStyle = cor;
        ctx.shadowColor = cor;
        ctx.shadowBlur = blur || 20;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 6.28);
        ctx.fill();
        ctx.restore();
    }

    function animar() {
        const elapsed = Date.now() - start;
        const progress = Math.min(1, elapsed / duracao);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch (personagemId) {
            case 'naruto': {
                const narDur = 4000;
                const pp = Math.min(1, elapsed / narDur);
                const nx = startX + 20;
                const ny = startY;
                const rasenganX = nx + 50;
                const rasenganY = ny - 10;

                function np(x, y, r, color, blur) {
                    ctx.save();
                    ctx.fillStyle = color;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = blur || 25;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // ===== PHASE 0: NARUTO POSES + SPIRAL CHAKRA (0.00 - 0.10) =====
                if (pp < 0.10) {
                    const t = pp / 0.10;
                    for (let i = 0; i < 10 * t; i++) {
                        const a = Math.random() * 6.28;
                        const d = 5 + t * 35;
                        np(nx + Math.cos(a) * d, ny + Math.sin(a) * d, 2 + Math.random() * 3, 'rgba(102, 217, 255, ' + (0.3 + t * 0.4) + ')', 12);
                    }
                    np(nx, ny, 5 + t * 15, 'rgba(102, 217, 255, ' + (0.15 + t * 0.2) + ')', 30);
                    np(rasenganX - 10, rasenganY, 3 + t * 4, 'rgba(255, 255, 255, ' + (t * 0.3) + ')', 20);
                }

                // ===== PHASE 1: RASENGAN FORMS + GROWS (0.10 - 0.30) =====
                else if (pp < 0.30) {
                    const t = (pp - 0.10) / 0.20;
                    const radius = 5 + t * 28;
                    np(rasenganX, rasenganY, radius + 18, 'rgba(56, 189, 248, ' + (0.06 + t * 0.08) + ')', 50);
                    np(rasenganX, rasenganY, radius, 'rgba(102, 217, 255, ' + (0.2 + t * 0.4) + ')', 40);
                    np(rasenganX, rasenganY, radius * 0.4, 'rgba(147, 234, 255, ' + (t * 0.5) + ')', 25);
                    np(rasenganX, rasenganY, radius * 0.15, 'rgba(255, 255, 255, ' + (t * 0.6) + ')', 20);
                    // Spiral lines
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.3 * t) + ')';
                    ctx.lineWidth = 1.5;
                    ctx.shadowColor = '#66d9ff';
                    ctx.shadowBlur = 12;
                    for (let i = 0; i < 3; i++) {
                        const rot = t * 4 + i * 2.09;
                        ctx.beginPath();
                        for (let s = 0; s <= 20; s++) {
                            const frac = s / 20;
                            const sa = rot + frac * 6.28;
                            const sr = radius * 0.15 + frac * radius * 0.6;
                            const sx = rasenganX + Math.cos(sa) * sr;
                            const sy = rasenganY + Math.sin(sa) * sr;
                            if (s === 0) ctx.moveTo(sx, sy);
                            else ctx.lineTo(sx, sy);
                        }
                        ctx.stroke();
                    }
                    ctx.restore();
                    for (let i = 0; i < 12 * t; i++) {
                        const a = Math.random() * 6.28;
                        const d = 12 + (1 - t) * 35;
                        np(rasenganX + Math.cos(a) * d, rasenganY + Math.sin(a) * d, 2 + Math.random() * 2, '#93eaff', 10);
                    }
                    np(nx + 5, ny, 3, 'rgba(255, 255, 255, ' + (0.2 + t * 0.3) + ')', 15);
                }

                // ===== PHASE 2: RASEN-SHURIKEN EMERGES (0.30 - 0.48) =====
                else if (pp < 0.48) {
                    const t = (pp - 0.30) / 0.18;
                    const radius = 33 + t * 20;
                    // Outer glow
                    np(rasenganX, rasenganY, radius + 25, 'rgba(56, 189, 248, ' + (0.12 + t * 0.06) + ')', 60);
                    np(rasenganX, rasenganY, radius, 'rgba(102, 217, 255, ' + (0.5 + t * 0.2) + ')', 50);
                    np(rasenganX, rasenganY, radius * 0.6, 'rgba(147, 234, 255, ' + (0.5 + t * 0.2) + ')', 35);
                    np(rasenganX, rasenganY, radius * 0.2, 'rgba(255, 255, 255, ' + (0.6 + t * 0.3) + ')', 25);
                    // Shuriken blades - 4 rotating blades
                    const bladeAngle = t * 6.28 * 2;
                    ctx.save();
                    ctx.shadowColor = '#66d9ff';
                    ctx.shadowBlur = 25;
                    for (let b = 0; b < 4; b++) {
                        const ba = bladeAngle + b * 1.5708;
                        const bladeLen = radius * (0.5 + t * 0.5);
                        const bladeWidth = 6 + t * 8;
                        const tipX = rasenganX + Math.cos(ba) * bladeLen;
                        const tipY = rasenganY + Math.sin(ba) * bladeLen;
                        const perpAngle = ba + 1.5708;
                        ctx.fillStyle = 'rgba(147, 234, 255, ' + (0.3 + t * 0.4) + ')';
                        ctx.beginPath();
                        ctx.moveTo(rasenganX + Math.cos(ba) * radius * 0.3, rasenganY + Math.sin(ba) * radius * 0.3);
                        ctx.lineTo(tipX + Math.cos(perpAngle) * bladeWidth, tipY + Math.sin(perpAngle) * bladeWidth);
                        ctx.lineTo(tipX - Math.cos(perpAngle) * bladeWidth, tipY - Math.sin(perpAngle) * bladeWidth);
                        ctx.closePath();
                        ctx.fill();
                        // Inner blade line
                        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.4 + t * 0.3) + ')';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(rasenganX + Math.cos(ba) * radius * 0.4, rasenganY + Math.sin(ba) * radius * 0.4);
                        ctx.lineTo(tipX, tipY);
                        ctx.stroke();
                    }
                    ctx.restore();
                    // Spinning energy rings
                    ctx.save();
                    ctx.strokeStyle = 'rgba(102, 217, 255, ' + (0.2 * t) + ')';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#66d9ff';
                    ctx.shadowBlur = 15;
                    for (let i = 0; i < 3; i++) {
                        const ro = radius + i * 8 + t * 5;
                        ctx.beginPath();
                        ctx.arc(rasenganX, rasenganY, ro, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    // Particles
                    for (let i = 0; i < 25; i++) {
                        const a = Math.random() * 6.28;
                        const d = radius * (0.3 + Math.random() * 0.9);
                        np(rasenganX + Math.cos(a) * d, rasenganY + Math.sin(a) * d, 2 + Math.random() * 4, Math.random() > 0.5 ? '#66d9ff' : '#93eaff', 12);
                    }
                    // Screen rumble
                    if (t > 0.5) {
                        const shake = 1 + (t - 0.5) * 3;
                        document.querySelectorAll('#pergunta, #opcoes, .header-info').forEach(el => {
                            el.style.transform = 'translate(' + (Math.random() - 0.5) * shake + 'px, ' + (Math.random() - 0.5) * shake + 'px)';
                        });
                    }
                }

                // ===== PHASE 3: RASEN-SHURIKEN THROWN (0.48 - 0.62) =====
                else if (pp < 0.62) {
                    const t = (pp - 0.48) / 0.14;
                    const throwX = rasenganX + t * (canvas.width - rasenganX + 50);
                    const throwY = rasenganY + Math.sin(t * 6.28) * 15;
                    const radius = 50 * (1 - t * 0.2);
                    // Shuriken glow while flying
                    np(throwX, throwY, radius + 20, 'rgba(56, 189, 248, ' + (0.1 * (1 - t)) + ')', 50);
                    np(throwX, throwY, radius, 'rgba(102, 217, 255, ' + (0.5 + t * 0.3) + ')', 45);
                    np(throwX, throwY, radius * 0.4, 'rgba(147, 234, 255, ' + (0.5 + t * 0.2) + ')', 30);
                    np(throwX, throwY, radius * 0.15, 'rgba(255, 255, 255, ' + (0.6 + t * 0.2) + ')', 20);
                    // Rotating blades
                    const bladeAngle = t * 6.28 * 3;
                    ctx.save();
                    ctx.shadowColor = '#66d9ff';
                    ctx.shadowBlur = 30;
                    for (let b = 0; b < 4; b++) {
                        const ba = bladeAngle + b * 1.5708;
                        const bladeLen = radius * 0.6;
                        const bladeWidth = 8 + t * 6;
                        const tipX = throwX + Math.cos(ba) * bladeLen;
                        const tipY = throwY + Math.sin(ba) * bladeLen;
                        const perpAngle = ba + 1.5708;
                        ctx.fillStyle = 'rgba(147, 234, 255, ' + (0.4 + t * 0.2) + ')';
                        ctx.beginPath();
                        ctx.moveTo(throwX + Math.cos(ba) * radius * 0.3, throwY + Math.sin(ba) * radius * 0.3);
                        ctx.lineTo(tipX + Math.cos(perpAngle) * bladeWidth, tipY + Math.sin(perpAngle) * bladeWidth);
                        ctx.lineTo(tipX - Math.cos(perpAngle) * bladeWidth, tipY - Math.sin(perpAngle) * bladeWidth);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.restore();
                    // Trail particles
                    for (let i = 0; i < 15; i++) {
                        const trailX = throwX - Math.random() * 60;
                        const trailY = throwY + (Math.random() - 0.5) * 30;
                        np(trailX, trailY, 2 + Math.random() * 3, '#93eaff', 8);
                    }
                    // Wind lines
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.15 * t) + ')';
                    ctx.lineWidth = 1.5;
                    for (let i = 0; i < 8; i++) {
                        const wy = throwY + (Math.random() - 0.5) * 50;
                        ctx.beginPath();
                        ctx.moveTo(throwX - 80, wy);
                        ctx.lineTo(throwX - 30, wy + (Math.random() - 0.5) * 15);
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                // ===== PHASE 4: IMPACT + ROTATING EXPLOSION (0.62 - 0.80) =====
                else if (pp < 0.80) {
                    const t = (pp - 0.62) / 0.18;
                    const impactX = rasenganX + 0.85 * (canvas.width - rasenganX + 50);
                    const impactY = rasenganY;
                    const explosionR = 15 + t * 60;
                    // Outer blast
                    np(impactX, impactY, explosionR + 30, 'rgba(56, 189, 248, ' + (0.06 + t * 0.08) + ')', 60);
                    np(impactX, impactY, explosionR, 'rgba(102, 217, 255, ' + (0.2 + t * 0.4) + ')', 50);
                    np(impactX, impactY, explosionR * 0.6, 'rgba(147, 234, 255, ' + (0.3 + t * 0.3) + ')', 35);
                    np(impactX, impactY, explosionR * 0.2, 'rgba(255, 255, 255, ' + (0.5 + t * 0.3) + ')', 25);
                    // Rotating shuriken debris
                    const rotAngle = t * 6.28 * 2;
                    ctx.save();
                    ctx.shadowColor = '#66d9ff';
                    ctx.shadowBlur = 30;
                    for (let b = 0; b < 4; b++) {
                        const ba = rotAngle + b * 1.5708;
                        const bladeLen = explosionR * (0.3 + t * 0.4);
                        const bladeWidth = 5 + t * 10;
                        const tipX = impactX + Math.cos(ba) * bladeLen;
                        const tipY = impactY + Math.sin(ba) * bladeLen;
                        const perpAngle = ba + 1.5708;
                        ctx.fillStyle = 'rgba(102, 217, 255, ' + (0.3 * (1 - t * 0.3)) + ')';
                        ctx.beginPath();
                        ctx.moveTo(impactX + Math.cos(ba) * explosionR * 0.2, impactY + Math.sin(ba) * explosionR * 0.2);
                        ctx.lineTo(tipX + Math.cos(perpAngle) * bladeWidth, tipY + Math.sin(perpAngle) * bladeWidth);
                        ctx.lineTo(tipX - Math.cos(perpAngle) * bladeWidth, tipY - Math.sin(perpAngle) * bladeWidth);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.restore();
                    // Shockwave rings
                    ctx.save();
                    for (let i = 0; i < 4; i++) {
                        const ringR = explosionR + i * 12 + t * 20;
                        ctx.strokeStyle = 'rgba(102, 217, 255, ' + (0.2 * (1 - i * 0.2) * (1 - t * 0.3)) + ')';
                        ctx.lineWidth = 2 + i;
                        ctx.shadowColor = '#66d9ff';
                        ctx.shadowBlur = 20;
                        ctx.beginPath();
                        ctx.arc(impactX, impactY, ringR, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    // Blue screen overlay
                    const gradAlpha = 0.08 * t;
                    ctx.save();
                    ctx.fillStyle = 'rgba(56, 189, 248, ' + gradAlpha + ')';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    // Bottom gradient
                    const grad2 = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
                    grad2.addColorStop(0, 'rgba(56, 189, 248, 0)');
                    grad2.addColorStop(1, 'rgba(56, 189, 248, ' + (0.12 * t) + ')');
                    ctx.save();
                    ctx.fillStyle = grad2;
                    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
                    ctx.restore();
                    // Debris particles
                    for (let i = 0; i < 30; i++) {
                        const a = Math.random() * 6.28;
                        const d = explosionR * (0.2 + Math.random() * 1.1);
                        np(impactX + Math.cos(a) * d, impactY + Math.sin(a) * d, 2 + Math.random() * 5, i % 3 === 0 ? '#93eaff' : '#66d9ff', 12);
                    }
                    // Screen shake
                    const shakeIntensity = 3 + t * 6;
                    document.querySelectorAll('#pergunta, #opcoes, .header-info').forEach(el => {
                        el.style.transform = 'translate(' + (Math.random() - 0.5) * shakeIntensity + 'px, ' + (Math.random() - 0.5) * shakeIntensity + 'px)';
                    });
                    // Blur question
                    const perguntaEl = document.getElementById('pergunta');
                    if (perguntaEl && t > 0.2) {
                        const blurP = (t - 0.2) / 0.8;
                        perguntaEl.style.opacity = 1 - blurP * 0.6;
                        perguntaEl.style.filter = 'blur(' + blurP * 6 + 'px)';
                    }
                }

                // ===== PHASE 5: BLUE EXPLOSION PEAK (0.80 - 0.93) =====
                else if (pp < 0.93) {
                    const t = (pp - 0.80) / 0.13;
                    const blastX = rasenganX + 0.85 * (canvas.width - rasenganX + 50);
                    const blastY = rasenganY;
                    const blastR = 30 + t * 100;
                    np(blastX, blastY, blastR + 30, 'rgba(56, 189, 248, ' + (0.06 + t * 0.06) + ')', 60);
                    np(blastX, blastY, blastR, 'rgba(102, 217, 255, ' + (0.2 + t * 0.3) + ')', 50);
                    np(blastX, blastY, blastR * 0.6, 'rgba(147, 234, 255, ' + (0.3 + t * 0.2) + ')', 35);
                    np(blastX, blastY, blastR * 0.15, 'rgba(255, 255, 255, ' + (0.5 * (1 - t * 0.5)) + ')', 30);
                    // Rotating debris
                    const rotAngle = t * 6.28 * 3;
                    ctx.save();
                    ctx.shadowColor = '#66d9ff';
                    ctx.shadowBlur = 25;
                    for (let b = 0; b < 6; b++) {
                        const ba = rotAngle + b * 1.047;
                        const bladeLen = blastR * (0.2 + t * 0.3);
                        const bladeWidth = 3 + t * 6;
                        const tipX = blastX + Math.cos(ba) * bladeLen;
                        const tipY = blastY + Math.sin(ba) * bladeLen;
                        const perpAngle = ba + 1.5708;
                        ctx.fillStyle = 'rgba(147, 234, 255, ' + (0.2 * (1 - t * 0.4)) + ')';
                        ctx.beginPath();
                        ctx.moveTo(blastX + Math.cos(ba) * blastR * 0.15, blastY + Math.sin(ba) * blastR * 0.15);
                        ctx.lineTo(tipX + Math.cos(perpAngle) * bladeWidth, tipY + Math.sin(perpAngle) * bladeWidth);
                        ctx.lineTo(tipX - Math.cos(perpAngle) * bladeWidth, tipY - Math.sin(perpAngle) * bladeWidth);
                        ctx.closePath();
                        ctx.fill();
                    }
                    ctx.restore();
                    // Shockwave rings
                    ctx.save();
                    for (let i = 0; i < 4; i++) {
                        const ringR = blastR + i * 15 + t * 25;
                        ctx.strokeStyle = 'rgba(102, 217, 255, ' + (0.2 * (1 - i * 0.2) * (1 - t * 0.3)) + ')';
                        ctx.lineWidth = 2 + i;
                        ctx.shadowColor = '#66d9ff';
                        ctx.shadowBlur = 20;
                        ctx.beginPath();
                        ctx.arc(blastX, blastY, ringR, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    // Blue screen overlay at peak
                    const peakAlpha = 0.08 + 0.10 * (1 - t);
                    ctx.save();
                    ctx.fillStyle = 'rgba(56, 189, 248, ' + peakAlpha + ')';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    const grad3 = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
                    grad3.addColorStop(0, 'rgba(56, 189, 248, 0)');
                    grad3.addColorStop(1, 'rgba(56, 189, 248, ' + (0.15 * (1 - t * 0.5)) + ')');
                    ctx.save();
                    ctx.fillStyle = grad3;
                    ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);
                    ctx.restore();
                    // Floating debris
                    for (let i = 0; i < 30; i++) {
                        const a = Math.random() * 6.28;
                        const d = blastR * (0.2 + Math.random() * 1.2);
                        np(blastX + Math.cos(a) * d, blastY + Math.sin(a) * d, 2 + Math.random() * 5, '#66d9ff', 8);
                    }
                    const perguntaEl = document.getElementById('pergunta');
                    if (perguntaEl) {
                        perguntaEl.style.opacity = Math.max(0, 0.4 - t * 0.4);
                        perguntaEl.style.filter = 'blur(' + (6 + t * 8) + 'px)';
                    }
                }

                // ===== PHASE 6: FADEOUT + BLUE CORNER EFFECT (0.93 - 1.00) =====
                else {
                    const t = (pp - 0.93) / 0.07;
                    np(rasenganX, rasenganY, 20 * (1 - t), 'rgba(102, 217, 255, ' + (0.15 * (1 - t)) + ')', 25);
                    // Blue corner effect (bottom-right)
                    ctx.save();
                    const cornerGrad = ctx.createRadialGradient(
                        canvas.width, canvas.height, 0,
                        canvas.width, canvas.height, canvas.width * 0.6
                    );
                    cornerGrad.addColorStop(0, 'rgba(56, 189, 248, ' + (0.35 * (1 - t * 0.3)) + ')');
                    cornerGrad.addColorStop(0.4, 'rgba(56, 189, 248, ' + (0.15 * (1 - t * 0.3)) + ')');
                    cornerGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
                    ctx.fillStyle = cornerGrad;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    ctx.save();
                    ctx.globalAlpha = t * 0.3;
                    const fadeGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
                    fadeGrad.addColorStop(0, '#0a1a2e');
                    fadeGrad.addColorStop(0.5, '#0e1e3e');
                    fadeGrad.addColorStop(1, '#050a1e');
                    ctx.fillStyle = fadeGrad;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    if (t > 0.5) {
                        document.querySelectorAll('#pergunta, #opcoes, .header-info').forEach(el => {
                            el.style.transform = '';
                            el.style.opacity = '';
                            el.style.filter = '';
                        });
                    }
                }
                break;
            }
            case 'goku': {
                const gokuDur = 4000;
                const pp = Math.min(1, elapsed / gokuDur);
                const gx = startX + 20;
                const gy = startY;
                const sphereX = gx + 50;
                const sphereY = gy - 10;

                function gp(x, y, r, color, blur) {
                    ctx.save();
                    ctx.fillStyle = color;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = blur || 25;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // ===== PHASE 0: GOKU POSES + SPARKS (0.00 - 0.10) =====
                if (pp < 0.10) {
                    const t = pp / 0.10;
                    // Energy sparks flying
                    for (let i = 0; i < 12 * t; i++) {
                        const a = Math.random() * 6.28;
                        const d = 5 + t * 40;
                        gp(gx + Math.cos(a) * d, gy + Math.sin(a) * d, 2 + Math.random() * 3, 'rgba(96, 165, 250, ' + (0.3 + t * 0.4) + ')', 12);
                    }
                    // Aura starting
                    gp(gx, gy, 5 + t * 18, 'rgba(96, 165, 250, ' + (0.15 + t * 0.2) + ')', 30);
                    // Hand glow
                    gp(sphereX - 10, sphereY, 3 + t * 5, 'rgba(255, 255, 255, ' + (t * 0.3) + ')', 20);
                }

                // ===== PHASE 1: SPHERE CHARGING (0.10 - 0.30) =====
                else if (pp < 0.30) {
                    const t = (pp - 0.10) / 0.20;
                    const radius = 5 + t * 30;
                    // Outer glow
                    gp(sphereX, sphereY, radius + 20, 'rgba(59, 130, 246, ' + (0.06 + t * 0.08) + ')', 50);
                    // Main sphere
                    gp(sphereX, sphereY, radius, 'rgba(96, 165, 250, ' + (0.2 + t * 0.4) + ')', 40);
                    // Core
                    gp(sphereX, sphereY, radius * 0.4, 'rgba(147, 197, 253, ' + (t * 0.5) + ')', 25);
                    // White hot center
                    gp(sphereX, sphereY, radius * 0.15, 'rgba(255, 255, 255, ' + (t * 0.6) + ')', 20);
                    // Energy rings
                    ctx.save();
                    ctx.strokeStyle = 'rgba(96, 165, 250, ' + (0.2 * t) + ')';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#60a5fa';
                    ctx.shadowBlur = 15;
                    for (let i = 0; i < 3; i++) {
                        const ro = radius + i * 10 + t * 5;
                        ctx.beginPath();
                        ctx.arc(sphereX, sphereY, ro, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    // Inward particles being absorbed
                    for (let i = 0; i < 15 * t; i++) {
                        const a = Math.random() * 6.28;
                        const d = 15 + (1 - t) * 40;
                        gp(sphereX + Math.cos(a) * d, sphereY + Math.sin(a) * d, 2 + Math.random() * 2, '#93c5fd', 10);
                    }
                    // Sparks from hands
                    gp(gx + 5, gy, 3, 'rgba(255, 255, 255, ' + (0.2 + t * 0.3) + ')', 15);
                }

                // ===== PHASE 2: SPHERE GROWS FULL (0.30 - 0.48) =====
                else if (pp < 0.48) {
                    const t = (pp - 0.30) / 0.18;
                    const radius = 35 + t * 15;
                    // Massive outer glow
                    gp(sphereX, sphereY, radius + 30, 'rgba(59, 130, 246, ' + (0.12 + t * 0.06) + ')', 60);
                    gp(sphereX, sphereY, radius, 'rgba(96, 165, 250, ' + (0.5 + t * 0.2) + ')', 50);
                    gp(sphereX, sphereY, radius * 0.6, 'rgba(147, 197, 253, ' + (0.5 + t * 0.2) + ')', 35);
                    gp(sphereX, sphereY, radius * 0.25, 'rgba(255, 255, 255, ' + (0.6 + t * 0.3) + ')', 25);
                    // Lightning arcs around sphere
                    ctx.save();
                    for (let i = 0; i < 6; i++) {
                        const a1 = Math.random() * 6.28;
                        const a2 = a1 + (Math.random() - 0.5) * 0.8;
                        const d1 = radius * 0.6;
                        const d2 = radius * (1.0 + Math.random() * 0.3);
                        ctx.strokeStyle = 'rgba(147, 197, 253, ' + (0.3 + t * 0.3) + ')';
                        ctx.lineWidth = 2 + Math.random() * 2;
                        ctx.shadowColor = '#60a5fa';
                        ctx.shadowBlur = 15;
                        ctx.beginPath();
                        ctx.moveTo(sphereX + Math.cos(a1) * d1, sphereY + Math.sin(a1) * d1);
                        for (let s = 1; s <= 4; s++) {
                            const frac = s / 4;
                            const lx = sphereX + Math.cos(a1 + (a2 - a1) * frac) * (d1 + (d2 - d1) * frac) + (Math.random() - 0.5) * 12;
                            const ly = sphereY + Math.sin(a1 + (a2 - a1) * frac) * (d1 + (d2 - d1) * frac) + (Math.random() - 0.5) * 12;
                            ctx.lineTo(lx, ly);
                        }
                        ctx.stroke();
                    }
                    ctx.restore();
                    // Energetic particles
                    for (let i = 0; i < 20; i++) {
                        const a = Math.random() * 6.28;
                        const d = radius * (0.3 + Math.random() * 0.8);
                        gp(sphereX + Math.cos(a) * d, sphereY + Math.sin(a) * d, 2 + Math.random() * 4, Math.random() > 0.5 ? '#60a5fa' : '#93c5fd', 12);
                    }
                    // Screen rumble during charge
                    if (t > 0.5) {
                        const shake = 1 + (t - 0.5) * 3;
                        document.querySelectorAll('#pergunta, #opcoes, .header-info').forEach(el => {
                            el.style.transform = 'translate(' + (Math.random() - 0.5) * shake + 'px, ' + (Math.random() - 0.5) * shake + 'px)';
                        });
                    }
                }

                // ===== PHASE 3: KAMEHAMEHA RELEASE (0.48 - 0.62) =====
                else if (pp < 0.62) {
                    const t = (pp - 0.48) / 0.14;
                    // Sphere compresses then explodes forward
                    const compress = 1 - t * 0.4;
                    const radius = 50 * compress;
                    // Compressed sphere 
                    gp(sphereX, sphereY, radius + 15 * (1 - t), 'rgba(59, 130, 246, ' + (0.15 * (1 - t)) + ')', 40);
                    gp(sphereX, sphereY, radius, 'rgba(96, 165, 250, ' + (0.6 + t * 0.2) + ')', 45);
                    gp(sphereX, sphereY, radius * 0.4, 'rgba(255, 255, 255, ' + (0.8 + t * 0.2) + ')', 30);
                    // Beam starting to form - blue line extending right
                    const beamStart = sphereX + radius * 0.5;
                    const beamLen = t * 150;
                    const beamWidth = 6 + t * 10;
                    // Outer beam glow
                    ctx.save();
                    ctx.shadowColor = '#3b82f6';
                    ctx.shadowBlur = 40;
                    ctx.fillStyle = 'rgba(59, 130, 246, ' + (0.3 + t * 0.3) + ')';
                    ctx.fillRect(beamStart, sphereY - beamWidth, beamLen, beamWidth * 2);
                    // Core beam
                    ctx.shadowBlur = 30;
                    ctx.fillStyle = 'rgba(147, 197, 253, ' + (0.5 + t * 0.3) + ')';
                    ctx.fillRect(beamStart, sphereY - beamWidth * 0.4, beamLen, beamWidth * 0.8);
                    // White hot core
                    ctx.shadowBlur = 20;
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.4 + t * 0.3) + ')';
                    ctx.fillRect(beamStart, sphereY - 3, beamLen, 6);
                    ctx.restore();
                    // Beam particles
                    for (let i = 0; i < 10; i++) {
                        const bx = beamStart + Math.random() * beamLen;
                        const by = sphereY + (Math.random() - 0.5) * beamWidth;
                        gp(bx, by, 2 + Math.random() * 3, '#93c5fd', 8);
                    }
                    // Shockwave ring
                    ctx.save();
                    ctx.strokeStyle = 'rgba(96, 165, 250, ' + (0.2 * (1 - t)) + ')';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#60a5fa';
                    ctx.shadowBlur = 20;
                    ctx.beginPath();
                    ctx.arc(sphereX, sphereY, 60 + t * 40, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }

                // ===== PHASE 4: BEAM TRAVELS + IMPACT (0.62 - 0.80) =====
                else if (pp < 0.80) {
                    const t = (pp - 0.62) / 0.18;
                    // The beam now reaches across the screen
                    const beamX = sphereX;
                    const beamEnd = sphereX + 100 + t * (canvas.width - sphereX + 50);
                    const beamWidth = 16 + t * 10;
                    // Full beam gradient
                    const grad = ctx.createLinearGradient(beamX, 0, beamEnd, 0);
                    grad.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
                    grad.addColorStop(0.3, 'rgba(96, 165, 250, 0.8)');
                    grad.addColorStop(0.7, 'rgba(147, 197, 253, 0.5)');
                    grad.addColorStop(1, 'rgba(59, 130, 246, 0.1)');
                    ctx.save();
                    ctx.shadowColor = '#3b82f6';
                    ctx.shadowBlur = 50;
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.moveTo(beamX, sphereY - beamWidth / 2);
                    ctx.lineTo(beamEnd, sphereY - beamWidth * 0.3);
                    ctx.lineTo(beamEnd, sphereY + beamWidth * 0.3);
                    ctx.lineTo(beamX, sphereY + beamWidth / 2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    // White hot core
                    ctx.save();
                    ctx.shadowColor = '#fff';
                    ctx.shadowBlur = 30;
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.3 + t * 0.3) + ')';
                    ctx.fillRect(beamX, sphereY - 4, beamEnd - beamX, 8);
                    ctx.restore();
                    // Impact at beam end - explosion building
                    const impactR = 10 + t * 50;
                    gp(beamEnd, sphereY, impactR + 25, 'rgba(59, 130, 246, ' + (0.05 + t * 0.1) + ')', 55);
                    gp(beamEnd, sphereY, impactR, 'rgba(96, 165, 250, ' + (0.2 + t * 0.4) + ')', 40);
                    gp(beamEnd, sphereY, impactR * 0.5, 'rgba(147, 197, 253, ' + (t * 0.4) + ')', 25);
                    gp(beamEnd, sphereY, impactR * 0.2, 'rgba(255, 255, 255, ' + (t * 0.5) + ')', 20);
                    // Explosion debris
                    for (let i = 0; i < 25; i++) {
                        const a = Math.random() * 6.28;
                        const d = impactR * (0.2 + Math.random() * 1.0);
                        gp(beamEnd + Math.cos(a) * d, sphereY + Math.sin(a) * d, 2 + Math.random() * 5, i % 3 === 0 ? '#93c5fd' : '#60a5fa', 12);
                    }
                    // Blue gradient overlay on screen
                    const gradAlpha = 0.08 * t;
                    ctx.save();
                    ctx.fillStyle = 'rgba(59, 130, 246, ' + gradAlpha + ')';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    // Additional gradient from bottom
                    const grad2 = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
                    grad2.addColorStop(0, 'rgba(59, 130, 246, 0)');
                    grad2.addColorStop(1, 'rgba(59, 130, 246, ' + (0.12 * t) + ')');
                    ctx.save();
                    ctx.fillStyle = grad2;
                    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
                    ctx.restore();
                    // Screen shake
                    const shakeIntensity = 3 + t * 6;
                    document.querySelectorAll('#pergunta, #opcoes, .header-info').forEach(el => {
                        el.style.transform = 'translate(' + (Math.random() - 0.5) * shakeIntensity + 'px, ' + (Math.random() - 0.5) * shakeIntensity + 'px)';
                    });
                    // Blur the question text
                    const perguntaEl = document.getElementById('pergunta');
                    if (perguntaEl && t > 0.2) {
                        const blurP = (t - 0.2) / 0.8;
                        perguntaEl.style.opacity = 1 - blurP * 0.6;
                        perguntaEl.style.filter = 'blur(' + blurP * 6 + 'px)';
                    }
                }

                // ===== PHASE 5: EXPLOSION + BLUE GRADIENT PEAK (0.80 - 0.93) =====
                else if (pp < 0.93) {
                    const t = (pp - 0.80) / 0.13;
                    // Massive explosion at impact point
                    const blastX = sphereX + 100 + 0.85 * (canvas.width - sphereX + 50);
                    const blastY = sphereY;
                    const blastR = 20 + t * 100;
                    // Outer blast
                    gp(blastX, blastY, blastR + 30, 'rgba(59, 130, 246, ' + (0.06 + t * 0.06) + ')', 60);
                    gp(blastX, blastY, blastR, 'rgba(96, 165, 250, ' + (0.2 + t * 0.3) + ')', 50);
                    gp(blastX, blastY, blastR * 0.6, 'rgba(147, 197, 253, ' + (0.3 + t * 0.2) + ')', 35);
                    gp(blastX, blastY, blastR * 0.2, 'rgba(255, 255, 255, ' + (0.5 * (1 - t * 0.5)) + ')', 30);
                    // Shockwave rings
                    ctx.save();
                    for (let i = 0; i < 4; i++) {
                        const ringR = blastR + i * 15 + t * 25;
                        ctx.strokeStyle = 'rgba(96, 165, 250, ' + (0.2 * (1 - i * 0.2) * (1 - t * 0.3)) + ')';
                        ctx.lineWidth = 2 + i;
                        ctx.shadowColor = '#60a5fa';
                        ctx.shadowBlur = 20;
                        ctx.beginPath();
                        ctx.arc(blastX, blastY, ringR, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    // Blue gradient overlay at full intensity
                    const peakAlpha = 0.08 + 0.10 * (1 - t);
                    ctx.save();
                    ctx.fillStyle = 'rgba(59, 130, 246, ' + peakAlpha + ')';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    // Bottom gradient
                    const grad3 = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
                    grad3.addColorStop(0, 'rgba(59, 130, 246, 0)');
                    grad3.addColorStop(1, 'rgba(59, 130, 246, ' + (0.15 * (1 - t * 0.5)) + ')');
                    ctx.save();
                    ctx.fillStyle = grad3;
                    ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);
                    ctx.restore();
                    // Floating debris
                    for (let i = 0; i < 30; i++) {
                        const a = Math.random() * 6.28;
                        const d = blastR * (0.2 + Math.random() * 1.2);
                        gp(blastX + Math.cos(a) * d, blastY + Math.sin(a) * d, 2 + Math.random() * 5, '#60a5fa', 8);
                    }
                    // Blur the question completely
                    const perguntaEl = document.getElementById('pergunta');
                    if (perguntaEl) {
                        perguntaEl.style.opacity = Math.max(0, 0.4 - t * 0.4);
                        perguntaEl.style.filter = 'blur(' + (6 + t * 8) + 'px)';
                    }
                }

                // ===== PHASE 6: FADEOUT + BLUE CORNER EFFECT + AUTO PROXIMA (0.93 - 1.00) =====
                else {
                    const t = (pp - 0.93) / 0.07;
                    // Residual glow
                    gp(sphereX, sphereY, 20 * (1 - t), 'rgba(96, 165, 250, ' + (0.15 * (1 - t)) + ')', 25);
                    // Blue corner effect (bottom-right)
                    ctx.save();
                    const cornerGrad = ctx.createRadialGradient(
                        canvas.width, canvas.height, 0,
                        canvas.width, canvas.height, canvas.width * 0.6
                    );
                    cornerGrad.addColorStop(0, 'rgba(59, 130, 246, ' + (0.35 * (1 - t * 0.3)) + ')');
                    cornerGrad.addColorStop(0.4, 'rgba(37, 99, 235, ' + (0.15 * (1 - t * 0.3)) + ')');
                    cornerGrad.addColorStop(1, 'rgba(37, 99, 235, 0)');
                    ctx.fillStyle = cornerGrad;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    // Blue fadeout overlay
                    ctx.save();
                    ctx.globalAlpha = t * 0.3;
                    const fadeGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
                    fadeGrad.addColorStop(0, '#1a1a3e');
                    fadeGrad.addColorStop(0.5, '#1e1e4a');
                    fadeGrad.addColorStop(1, '#0a0a2e');
                    ctx.fillStyle = fadeGrad;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    // Clean up
                    if (t > 0.5) {
                        document.querySelectorAll('#pergunta, #opcoes, .header-info').forEach(el => {
                            el.style.transform = '';
                            el.style.opacity = '';
                            el.style.filter = '';
                        });
                    }
                }
                break;
            }
            case 'luffy': {
                const rPhase = progress < 0.25 ? 0 : progress < 0.5 ? 1 : 2;
                const pp = rPhase === 0 ? progress / 0.25 : rPhase === 1 ? (progress - 0.25) / 0.25 : (progress - 0.5) / 0.5;
                if (rPhase === 0) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 8]);
                    const armLen = pp * 100;
                    ctx.beginPath();
                    ctx.moveTo(startX + 30, startY);
                    ctx.lineTo(startX + 30 - armLen, startY - 10);
                    ctx.stroke();
                    ctx.restore();
                    drawCircle(startX + 30 - pp * 100, startY - 10, 12 + pp * 2, '#ff6b35', 20);
                } else if (rPhase === 1) {
                    const fromX = startX + 30 - 100, fromY = startY - 10;
                    const fistX = fromX + (cx - fromX) * pp;
                    const fistY = fromY + (cy - fromY) * pp;
                    drawCircle(fistX, fistY, 14, '#ef4444', 25);
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([4, 6]);
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(fistX, fistY);
                    ctx.stroke();
                    ctx.restore();
                } else {
                    const impactX = cx, impactY = cy;
                    for (let i = 0; i < 40; i++) {
                        const a = Math.random() * 6.28;
                        const d = pp * 150;
                        const size = 2 + Math.random() * 6;
                        ctx.save();
                        ctx.globalAlpha = (1 - pp) * 0.7;
                        ctx.fillStyle = '#fbbf24';
                        ctx.shadowColor = '#fbbf24';
                        ctx.shadowBlur = 10;
                        ctx.save();
                        ctx.translate(impactX + Math.cos(a) * d, impactY + Math.sin(a) * d);
                        ctx.rotate(a);
                        ctx.fillRect(-size / 2, -1, size, 2);
                        ctx.restore();
                        ctx.restore();
                    }
                    drawCircle(impactX, impactY, 20 * (1 - pp), 'rgba(255,255,255,' + (0.6 * (1 - pp)) + ')', 50);
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255,200,0,' + (0.3 * (1 - pp)) + ')';
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 6; i++) {
                        const a = i * 1.05;
                        const r = 15 + pp * 50;
                        ctx.beginPath();
                        ctx.moveTo(impactX + Math.cos(a) * r * 0.5, impactY + Math.sin(a) * r * 0.5);
                        ctx.lineTo(impactX + Math.cos(a) * r, impactY + Math.sin(a) * r);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
                break;
            }
            case 'pikachu': {
                const pp = progress;
                const boltCount = Math.floor(pp * 8);
                for (let i = 0; i < boltCount; i++) {
                    const bx = cx + (Math.random() - 0.5) * 100;
                    const by = (Math.random() - 0.5) * 100;
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, 1 - (pp - i * 0.12) * 3);
                    ctx.strokeStyle = '#fbbf24';
                    ctx.shadowColor = '#fff';
                    ctx.shadowBlur = 25;
                    ctx.lineWidth = 3 + Math.random() * 3;
                    ctx.beginPath();
                    let lx = bx, ly = -20;
                    ctx.moveTo(lx, ly);
                    for (let j = 0; j < 5; j++) {
                        lx += (Math.random() - 0.5) * 50;
                        ly += 40 + Math.random() * 30;
                        ctx.lineTo(lx, ly);
                    }
                    ctx.stroke();
                    ctx.restore();
                }
                if (pp > 0.8) {
                    botoes.forEach((btn, i) => {
                        if (i === item.correta) {
                            const r = btn.getBoundingClientRect();
                            const bx = r.left + r.width / 2, by = r.top + r.height / 2;
                            ctx.save();
                            ctx.globalAlpha = (pp - 0.8) * 2;
                            ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
                            ctx.shadowColor = '#fbbf24';
                            ctx.shadowBlur = 40;
                            ctx.beginPath();
                            ctx.arc(bx, by, 40 + (pp - 0.8) * 20, 0, 6.28);
                            ctx.fill();
                            ctx.restore();
                        }
                    });
                }
                break;
            }
            case 'tanjiro': {
                const rPhase = progress < 0.3 ? 0 : progress < 0.55 ? 1 : 2;
                const pp = rPhase === 0 ? progress / 0.3 : rPhase === 1 ? (progress - 0.3) / 0.25 : (progress - 0.55) / 0.45;
                if (rPhase === 0) {
                    for (let i = 0; i < 15; i++) {
                        const a = i * 0.42 + pp * 3;
                        const d = 10 + pp * 40;
                        const x = startX + Math.cos(a) * d;
                        const y = startY + Math.sin(a) * d;
                        ctx.save();
                        ctx.globalAlpha = 0.5;
                        ctx.fillStyle = '#4ade80';
                        ctx.shadowColor = '#4ade80';
                        ctx.shadowBlur = 15;
                        ctx.beginPath();
                        ctx.arc(x, y, 3 + Math.sin(a) * 2, 0, 6.28);
                        ctx.fill();
                        ctx.restore();
                    }
                } else if (rPhase === 1) {
                    const waveY = startY + Math.sin(pp * 6.28) * 40;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)';
                    ctx.shadowColor = '#4ade80';
                    ctx.shadowBlur = 25;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    for (let x = 0; x < (cx - startX) * pp; x += 5) {
                        ctx.lineTo(startX + x, startY + Math.sin(x * 0.05) * 30);
                    }
                    ctx.stroke();
                    ctx.restore();
                } else {
                    const vidaEls = document.querySelectorAll('.vida:not(.perdida)');
                    vidaEls.forEach(el => {
                        const r = el.getBoundingClientRect();
                        const vx = r.left + r.width / 2, vy = r.top + r.height / 2;
                        drawCircle(vx, vy, 12 * (1 - pp), 'rgba(74, 222, 128, ' + (0.4 * (1 - pp)) + ')', 25);
                        ctx.save();
                        ctx.globalAlpha = (1 - pp) * 0.6;
                        ctx.fillStyle = '#4ade80';
                        ctx.shadowColor = '#4ade80';
                        ctx.shadowBlur = 10;
                        for (let k = 0; k < 5; k++) {
                            const a = Math.random() * 6.28;
                            const d = Math.random() * 20;
                            ctx.beginPath();
                            ctx.arc(vx + Math.cos(a) * d, vy + Math.sin(a) * d, 2, 0, 6.28);
                            ctx.fill();
                        }
                        ctx.restore();
                    });
                }
                break;
            }
            case 'gojo': {
                const gojoDur = 3800;
                const pp = Math.min(1, elapsed / gojoDur);
                const gx = startX + 20;
                const gy = startY;
                const voidStartX = gx + 70;

                // Helper: glowing circle
                function gc(x, y, r, color, blur) {
                    ctx.save();
                    ctx.fillStyle = color;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = blur || 25;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // Debris/particles
                const particleCount = 20 + Math.floor(pp * 40);

                // Draw Gojo silhouette with hand sign
                function drawGojo(alpha, armReach) {
                    const a = alpha || 1;
                    ctx.save();
                    ctx.globalAlpha = a;
                    ctx.shadowBlur = 0;
                    // Blindfold
                    // Extended arm with hand sign
                    const reach = armReach || 1;
                    ctx.beginPath();
                    ctx.stroke();
                    ctx.restore();
                }

                // ===== PHASE 0: GOJO POSE (0.00 - 0.10) =====
                if (pp < 0.10) {
                    const t = pp / 0.10;
                    drawGojo(t, 0.3 + t * 0.7);
                    const reach = 0.3 + t * 0.7;
                    gc(gx + 45 * reach, gy + 10 - 15 * reach, 5 + t * 10, 'rgba(59, 130, 246, ' + (0.2 + t * 0.3) + ')', 25);
                }

                // ===== PHASE 1: RED VOID (0.10 - 0.28) =====
                else if (pp < 0.28) {
                    const t = (pp - 0.10) / 0.18;
                    drawGojo(1, 1);
                    const vx = voidStartX;
                    const vy = gy;
                    const radius = 8 + t * 45;
                    // Outer glow
                    gc(vx, vy, radius + 20, 'rgba(255, 60, 60, ' + (0.08 * t) + ')', 50);
                    gc(vx, vy, radius, 'rgba(255, 40, 40, ' + (0.25 + t * 0.3) + ')', 35);
                    gc(vx, vy, radius * 0.5, 'rgba(255, 120, 80, ' + (t * 0.5) + ')', 20);
                    // Energy rings
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255, 60, 60, ' + (0.3 * t) + ')';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#ff4444';
                    ctx.shadowBlur = 15;
                    for (let i = 0; i < 3; i++) {
                        const ro = t * 8 + i * 7;
                        ctx.beginPath();
                        ctx.arc(vx, vy, radius + ro, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    // Red particles
                    for (let i = 0; i < 10 * t; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const d = radius * (0.4 + Math.random() * 0.7);
                        gc(vx + Math.cos(a) * d, vy + Math.sin(a) * d, 2 + Math.random() * 3, '#ff6666', 12);
                    }
                    // Hand glow
                    gc(vx, vy, 5, 'rgba(255, 255, 255, ' + (0.2 + t * 0.5) + ')', 30);
                }

                // ===== PHASE 2: BLUE VOID (0.28 - 0.45) =====
                else if (pp < 0.45) {
                    const t = (pp - 0.28) / 0.17;
                    drawGojo(1, 1);
                    const rvx = voidStartX;
                    const bvx = voidStartX + 90;
                    const vy = gy;
                    // Red void (fully formed)
                    gc(rvx, vy, 45, 'rgba(255, 40, 40, 0.5)', 35);
                    gc(rvx, vy, 22, 'rgba(255, 120, 80, 0.6)', 20);
                    // Red rings
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255, 60, 60, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#ff4444';
                    ctx.shadowBlur = 12;
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.arc(rvx, vy, 45 + i * 7, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    // Blue void forming
                    const bRadius = 8 + t * 42;
                    gc(bvx, vy, bRadius + 18, 'rgba(60, 100, 255, ' + (0.08 * t) + ')', 50);
                    gc(bvx, vy, bRadius, 'rgba(60, 100, 255, ' + (0.25 + t * 0.3) + ')', 35);
                    gc(bvx, vy, bRadius * 0.5, 'rgba(100, 160, 255, ' + (t * 0.5) + ')', 20);
                    // Blue rings
                    ctx.save();
                    ctx.strokeStyle = 'rgba(60, 100, 255, ' + (0.3 * t) + ')';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#4466ff';
                    ctx.shadowBlur = 12;
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.arc(bvx, vy, bRadius + i * 7, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    // Particles
                    for (let i = 0; i < 15; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const dR = 20 + Math.random() * 40;
                        const side = i < 7 ? rvx : bvx;
                        gc(side + Math.cos(a) * dR, vy + Math.sin(a) * dR, 2 + Math.random() * 3, i < 7 ? '#ff6666' : '#6688ff', 10);
                    }
                }

                // ===== PHASE 3: CONVERGENCE (0.45 - 0.62) =====
                else if (pp < 0.62) {
                    const t = (pp - 0.45) / 0.17;
                    drawGojo(1 - t * 0.3, 1);
                    const startDist = 90;
                    const dist = startDist * (1 - t);
                    const rvx = voidStartX + dist;
                    const bvx = voidStartX + 90 - dist;
                    const vy = gy;
                    const midX = (rvx + bvx) / 2;
                    // Red void shrinking
                    gc(rvx, vy, 45 * (1 - t * 0.4), 'rgba(255, 40, 40, ' + (0.5 + t * 0.2) + ')', 30);
                    gc(rvx, vy, 22 * (1 - t * 0.3), 'rgba(255, 120, 80, 0.7)', 20);
                    // Blue void shrinking
                    gc(bvx, vy, 48 * (1 - t * 0.4), 'rgba(60, 100, 255, ' + (0.5 + t * 0.2) + ')', 30);
                    gc(bvx, vy, 24 * (1 - t * 0.3), 'rgba(100, 160, 255, 0.7)', 20);
                    // Purple connection between them
                    ctx.save();
                    ctx.strokeStyle = 'rgba(168, 85, 247, ' + (t * 0.6) + ')';
                    ctx.lineWidth = 2 + t * 5;
                    ctx.shadowColor = '#a855f7';
                    ctx.shadowBlur = 25;
                    ctx.beginPath();
                    ctx.moveTo(rvx, vy);
                    ctx.lineTo(bvx, vy);
                    ctx.stroke();
                    ctx.restore();
                    // Purple sparks
                    for (let i = 0; i < 12; i++) {
                        const sx = rvx + Math.random() * (bvx - rvx);
                        const sy = vy + (Math.random() - 0.5) * 30;
                        gc(sx, sy, 2 + Math.random() * 4, '#a855f7', 15);
                    }
                    // Purple glow building at center
                    const intensity = t * 0.4;
                    gc(midX, vy, 5 + t * 30, 'rgba(168, 85, 247, ' + intensity + ')', 40);
                }

                // ===== PHASE 4: HOLLOW PURPLE EMERGES (0.62 - 0.78) =====
                else if (pp < 0.78) {
                    const t = (pp - 0.62) / 0.16;
                    drawGojo(0.5 - t * 0.3, 1);
                    const midX = voidStartX + 45;
                    const vy = gy;
                    const radius = 10 + t * 90;
                    // Outer glow expansion
                    gc(midX, vy, radius + 30, 'rgba(168, 85, 247, ' + (0.06 + t * 0.06) + ')', 60);
                    gc(midX, vy, radius, 'rgba(168, 85, 247, ' + (0.3 + t * 0.3) + ')', 45);
                    gc(midX, vy, radius * 0.7, 'rgba(200, 120, 255, ' + (0.5 * t) + ')', 35);
                    gc(midX, vy, radius * 0.3, 'rgba(255, 200, 255, ' + (t * 0.6) + ')', 25);
                    // Shockwave rings
                    ctx.save();
                    for (let i = 0; i < 4; i++) {
                        const ro = radius + i * 15 + t * 20;
                        ctx.strokeStyle = 'rgba(168, 85, 247, ' + (0.3 * (1 - i * 0.2) * t) + ')';
                        ctx.lineWidth = 2 + i * 0.5;
                        ctx.shadowColor = '#a855f7';
                        ctx.shadowBlur = 20;
                        ctx.beginPath();
                        ctx.arc(midX, vy, ro, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    // Energetic particles exploding
                    for (let i = 0; i < 25; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const d = Math.random() * radius * 1.3;
                        gc(midX + Math.cos(a) * d, vy + Math.sin(a) * d, 2 + Math.random() * 5, '#c084fc', 15);
                    }
                    // Lightning arcs
                    for (let i = 0; i < 6; i++) {
                        const a1 = Math.random() * Math.PI * 2;
                        const a2 = a1 + (Math.random() - 0.5) * 0.5;
                        const d1 = radius * 0.3;
                        const d2 = radius * (0.8 + Math.random() * 0.4);
                        ctx.save();
                        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.3 * t) + ')';
                        ctx.lineWidth = 2;
                        ctx.shadowColor = '#a855f7';
                        ctx.shadowBlur = 15;
                        ctx.beginPath();
                        ctx.moveTo(midX + Math.cos(a1) * d1, vy + Math.sin(a1) * d1);
                        const steps = 5;
                        for (let s = 1; s <= steps; s++) {
                            const frac = s / steps;
                            const lx = midX + Math.cos(a1 + (a2 - a1) * frac) * (d1 + (d2 - d1) * frac) + (Math.random() - 0.5) * 15;
                            const ly = vy + Math.sin(a1 + (a2 - a1) * frac) * (d1 + (d2 - d1) * frac) + (Math.random() - 0.5) * 15;
                            ctx.lineTo(lx, ly);
                        }
                        ctx.stroke();
                        ctx.restore();
                    }
                }

                // ===== PHASE 5: DESTRUCTION BEAM (0.78 - 0.93) =====
                else if (pp < 0.93) {
                    const t = (pp - 0.78) / 0.15;
                    drawGojo(0.2 - t * 0.1, 1);
                    const originX = voidStartX + 45;
                    const vy = gy;
                    const beamEndX = canvas.width + 50;
                    const beamLen = 50 + (beamEndX - originX) * t;
                    // Main beam - expanding cone of purple energy
                    const startWidth = 15 + t * 10;
                    const endWidth = 30 + t * 80;
                    const grad = ctx.createLinearGradient(originX, 0, originX + beamLen, 0);
                    grad.addColorStop(0, 'rgba(200, 120, 255, 0.9)');
                    grad.addColorStop(0.3, 'rgba(168, 85, 247, 0.8)');
                    grad.addColorStop(0.7, 'rgba(120, 60, 200, 0.5)');
                    grad.addColorStop(1, 'rgba(80, 40, 150, 0.1)');
                    ctx.save();
                    ctx.fillStyle = grad;
                    ctx.shadowColor = '#a855f7';
                    ctx.shadowBlur = 50;
                    ctx.beginPath();
                    ctx.moveTo(originX, vy - startWidth / 2);
                    ctx.lineTo(originX + beamLen, vy - endWidth / 2);
                    ctx.lineTo(originX + beamLen, vy + endWidth / 2);
                    ctx.lineTo(originX, vy + startWidth / 2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    // Core beam
                    ctx.save();
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.3 + t * 0.2) + ')';
                    ctx.shadowColor = '#fff';
                    ctx.shadowBlur = 30;
                    ctx.fillRect(originX, vy - 3, beamLen, 6);
                    ctx.restore();
                    // Destruction dust/debris
                    for (let i = 0; i < 20; i++) {
                        const dx = originX + beamLen * Math.random();
                        const dy = vy + (Math.random() - 0.5) * (30 + t * 50);
                        gc(dx, dy, 3 + Math.random() * 6, i % 2 === 0 ? '#a855f7' : '#e8e8e8', 8);
                    }
                    // Screen shake effect (CSS transform on text elements)
                    const shakeIntensity = 3 + t * 5;
                    const shakeEls = document.querySelectorAll('#pergunta, #opcoes, .header-info');
                    shakeEls.forEach(el => {
                        el.style.transform = 'translate(' + (Math.random() - 0.5) * shakeIntensity + 'px, ' + (Math.random() - 0.5) * shakeIntensity + 'px)';
                    });
                    // Impact on question text
                    const perguntaEl = document.getElementById('pergunta');
                    if (perguntaEl && t > 0.3) {
                        const progress = (t - 0.3) / 0.7;
                        if (progress > 0.5) {
                            perguntaEl.style.opacity = 1 - (progress - 0.5) * 2;
                            perguntaEl.style.filter = 'blur(' + (progress - 0.5) * 8 + 'px)';
                        }
                    }
                }

                // ===== PHASE 6: FADEOUT + AUTO PROXIMA (0.93 - 1.00) =====
                else {
                    const t = (pp - 0.93) / 0.07;
                    drawGojo(Math.max(0, 0.1 * (1 - t)), 0.5);
                    // Residual purple glow
                    gc(voidStartX + 45, gy, 30 * (1 - t), 'rgba(168, 85, 247, ' + (0.2 * (1 - t)) + ')', 30);
                    // Fade everything
                    ctx.save();
                    ctx.globalAlpha = t * 0.4;
                    ctx.fillStyle = '#1a1a2e';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    // Clean up screen shake
                    if (t > 0.5) {
                        document.querySelectorAll('#pergunta, #opcoes, .header-info').forEach(el => {
                            el.style.transform = '';
                            el.style.opacity = '';
                            el.style.filter = '';
                        });
                    }
                }
                break;
            }
            case 'mikasa': {
                const pp = progress;
                const numSlash = Math.min(3, Math.floor(pp * 5));
                for (let i = 0; i < numSlash; i++) {
                    const sx = 100 + i * 120 + Math.sin(pp * 3 + i) * 50;
                    const sy = 100 + i * 80 + Math.cos(pp * 2 + i) * 50;
                    const ex = sx + 80 + Math.sin(pp * 4 + i) * 40;
                    const ey = sy - 60 - Math.cos(pp * 3 + i) * 40;
                    const alpha = Math.max(0, 1 - (pp - i * 0.2) * 2);
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.strokeStyle = '#fff';
                    ctx.shadowColor = '#8b5cf6';
                    ctx.shadowBlur = 20;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(ex, ey);
                    ctx.stroke();
                    ctx.strokeStyle = 'rgba(139, 92, 246, ' + alpha * 0.5 + ')';
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.moveTo(sx + 5, sy - 5);
                    ctx.lineTo(ex + 5, ey - 5);
                    ctx.stroke();
                    ctx.restore();
                }
                break;
            }
            case 'sailor': {
                const rPhase = progress < 0.3 ? 0 : progress < 0.6 ? 1 : 2;
                const pp = rPhase === 0 ? progress / 0.3 : rPhase === 1 ? (progress - 0.3) / 0.3 : (progress - 0.6) / 0.4;
                if (rPhase === 0) {
                    drawCircle(startX, startY, 5 + pp * 25, 'rgba(236, 72, 153, ' + (0.3 + pp * 0.3) + ')', 35);
                    ctx.save();
                    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                    ctx.setLineDash([3, 5]);
                    ctx.beginPath();
                    ctx.arc(startX, startY, 25 + pp * 15, 0, 6.28);
                    ctx.stroke();
                    ctx.restore();
                } else if (rPhase === 1) {
                    const ringR = 25 + pp * 100;
                    ctx.save();
                    ctx.globalAlpha = 0.3 * (1 - pp * 0.4);
                    ctx.strokeStyle = '#ec4899';
                    ctx.shadowColor = '#ec4899';
                    ctx.shadowBlur = 30;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(startX, startY, ringR, 0, 6.28);
                    ctx.stroke();
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(startX, startY, ringR + 8, 0, 6.28);
                    ctx.stroke();
                    ctx.restore();
                } else {
                    const vidaEls = document.querySelectorAll('.vida');
                    vidaEls.forEach(el => {
                        const r = el.getBoundingClientRect();
                        const vx = r.left + r.width / 2, vy = r.top + r.height / 2;
                        drawCircle(vx, vy, 8 + pp * 10, 'rgba(236, 72, 153, ' + (0.3 * (1 - pp)) + ')', 25);
                        ctx.save();
                        ctx.globalAlpha = (1 - pp) * 0.5;
                        ctx.fillStyle = '#f472b6';
                        ctx.shadowColor = '#ec4899';
                        ctx.shadowBlur = 10;
                        for (let k = 0; k < 3; k++) {
                            const a = Math.random() * 6.28;
                            const d = Math.random() * 15;
                            ctx.beginPath();
                            ctx.arc(vx + Math.cos(a) * d, vy + Math.sin(a) * d, 2 + Math.random() * 2, 0, 6.28);
                            ctx.fill();
                        }
                        ctx.restore();
                    });
                }
                break;
            }
            case 'vegeta': {
                const vegDur = 4000;
                const pp = Math.min(1, elapsed / vegDur);
                const vx = startX + 20;
                const vy = startY;
                const sphereX = vx + 50;
                const sphereY = vy - 10;

                function vp(x, y, r, color, blur) {
                    ctx.save();
                    ctx.fillStyle = color;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = blur || 25;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // ===== PHASE 0: VEGETA POSES + GOLDEN SPARKS (0.00 - 0.10) =====
                if (pp < 0.10) {
                    const t = pp / 0.10;
                    for (let i = 0; i < 12 * t; i++) {
                        const a = Math.random() * 6.28;
                        const d = 5 + t * 40;
                        vp(vx + Math.cos(a) * d, vy + Math.sin(a) * d, 2 + Math.random() * 3, 'rgba(250, 204, 21, ' + (0.3 + t * 0.4) + ')', 12);
                    }
                    vp(vx, vy, 5 + t * 18, 'rgba(250, 204, 21, ' + (0.15 + t * 0.2) + ')', 30);
                    vp(sphereX - 10, sphereY, 3 + t * 5, 'rgba(255, 255, 255, ' + (t * 0.3) + ')', 20);
                }

                // ===== PHASE 1: SPHERE CHARGING (0.10 - 0.30) =====
                else if (pp < 0.30) {
                    const t = (pp - 0.10) / 0.20;
                    const radius = 5 + t * 30;
                    vp(sphereX, sphereY, radius + 20, 'rgba(234, 179, 8, ' + (0.06 + t * 0.08) + ')', 50);
                    vp(sphereX, sphereY, radius, 'rgba(250, 204, 21, ' + (0.2 + t * 0.4) + ')', 40);
                    vp(sphereX, sphereY, radius * 0.4, 'rgba(253, 224, 71, ' + (t * 0.5) + ')', 25);
                    vp(sphereX, sphereY, radius * 0.15, 'rgba(255, 255, 255, ' + (t * 0.6) + ')', 20);
                    ctx.save();
                    ctx.strokeStyle = 'rgba(250, 204, 21, ' + (0.2 * t) + ')';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#facc15';
                    ctx.shadowBlur = 15;
                    for (let i = 0; i < 3; i++) {
                        const ro = radius + i * 10 + t * 5;
                        ctx.beginPath();
                        ctx.arc(sphereX, sphereY, ro, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    for (let i = 0; i < 15 * t; i++) {
                        const a = Math.random() * 6.28;
                        const d = 15 + (1 - t) * 40;
                        vp(sphereX + Math.cos(a) * d, sphereY + Math.sin(a) * d, 2 + Math.random() * 2, '#fde047', 10);
                    }
                    vp(vx + 5, vy, 3, 'rgba(255, 255, 255, ' + (0.2 + t * 0.3) + ')', 15);
                }

                // ===== PHASE 2: SPHERE GROWS FULL + LIGHTNING (0.30 - 0.48) =====
                else if (pp < 0.48) {
                    const t = (pp - 0.30) / 0.18;
                    const radius = 35 + t * 15;
                    vp(sphereX, sphereY, radius + 30, 'rgba(234, 179, 8, ' + (0.12 + t * 0.06) + ')', 60);
                    vp(sphereX, sphereY, radius, 'rgba(250, 204, 21, ' + (0.5 + t * 0.2) + ')', 50);
                    vp(sphereX, sphereY, radius * 0.6, 'rgba(253, 224, 71, ' + (0.5 + t * 0.2) + ')', 35);
                    vp(sphereX, sphereY, radius * 0.25, 'rgba(255, 255, 255, ' + (0.6 + t * 0.3) + ')', 25);
                    // Lightning rays around sphere
                    ctx.save();
                    for (let i = 0; i < 10; i++) {
                        const a1 = Math.random() * 6.28;
                        const a2 = a1 + (Math.random() - 0.5) * 1.0;
                        const d1 = radius * 0.5;
                        const d2 = radius * (1.2 + Math.random() * 0.5);
                        ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.4 + t * 0.4) + ')';
                        ctx.lineWidth = 2 + Math.random() * 3;
                        ctx.shadowColor = '#facc15';
                        ctx.shadowBlur = 20;
                        ctx.beginPath();
                        ctx.moveTo(sphereX + Math.cos(a1) * d1, sphereY + Math.sin(a1) * d1);
                        for (let s = 1; s <= 5; s++) {
                            const frac = s / 5;
                            const lx = sphereX + Math.cos(a1 + (a2 - a1) * frac) * (d1 + (d2 - d1) * frac) + (Math.random() - 0.5) * 15;
                            const ly = sphereY + Math.sin(a1 + (a2 - a1) * frac) * (d1 + (d2 - d1) * frac) + (Math.random() - 0.5) * 15;
                            ctx.lineTo(lx, ly);
                        }
                        ctx.stroke();
                    }
                    ctx.restore();
                    // Additional golden bolts
                    ctx.save();
                    for (let i = 0; i < 6; i++) {
                        const angle = Math.random() * 6.28;
                        const len = radius * (1.0 + Math.random() * 0.8);
                        ctx.strokeStyle = 'rgba(250, 204, 21, ' + (0.3 + t * 0.3) + ')';
                        ctx.lineWidth = 2;
                        ctx.shadowColor = '#facc15';
                        ctx.shadowBlur = 25;
                        ctx.beginPath();
                        ctx.moveTo(sphereX + Math.cos(angle) * radius * 0.4, sphereY + Math.sin(angle) * radius * 0.4);
                        const midX = sphereX + Math.cos(angle) * radius * 0.7 + (Math.random() - 0.5) * 10;
                        const midY = sphereY + Math.sin(angle) * radius * 0.7 + (Math.random() - 0.5) * 10;
                        ctx.lineTo(midX, midY);
                        ctx.lineTo(sphereX + Math.cos(angle) * len, sphereY + Math.sin(angle) * len);
                        ctx.stroke();
                    }
                    ctx.restore();
                    for (let i = 0; i < 20; i++) {
                        const a = Math.random() * 6.28;
                        const d = radius * (0.3 + Math.random() * 0.8);
                        vp(sphereX + Math.cos(a) * d, sphereY + Math.sin(a) * d, 2 + Math.random() * 4, Math.random() > 0.5 ? '#facc15' : '#fde047', 12);
                    }
                    if (t > 0.5) {
                        const shake = 1 + (t - 0.5) * 3;
                        document.querySelectorAll('#pergunta, #opcoes, .header-info').forEach(el => {
                            el.style.transform = 'translate(' + (Math.random() - 0.5) * shake + 'px, ' + (Math.random() - 0.5) * shake + 'px)';
                        });
                    }
                }

                // ===== PHASE 3: FINAL FLASH RELEASE (0.48 - 0.62) =====
                else if (pp < 0.62) {
                    const t = (pp - 0.48) / 0.14;
                    const compress = 1 - t * 0.4;
                    const radius = 50 * compress;
                    vp(sphereX, sphereY, radius + 15 * (1 - t), 'rgba(234, 179, 8, ' + (0.15 * (1 - t)) + ')', 40);
                    vp(sphereX, sphereY, radius, 'rgba(250, 204, 21, ' + (0.6 + t * 0.2) + ')', 45);
                    vp(sphereX, sphereY, radius * 0.4, 'rgba(255, 255, 255, ' + (0.8 + t * 0.2) + ')', 30);
                    const beamStart = sphereX + radius * 0.5;
                    const beamLen = t * 150;
                    const beamWidth = 6 + t * 10;
                    ctx.save();
                    ctx.shadowColor = '#eab308';
                    ctx.shadowBlur = 40;
                    ctx.fillStyle = 'rgba(234, 179, 8, ' + (0.3 + t * 0.3) + ')';
                    ctx.fillRect(beamStart, sphereY - beamWidth, beamLen, beamWidth * 2);
                    ctx.shadowBlur = 30;
                    ctx.fillStyle = 'rgba(253, 224, 71, ' + (0.5 + t * 0.3) + ')';
                    ctx.fillRect(beamStart, sphereY - beamWidth * 0.4, beamLen, beamWidth * 0.8);
                    ctx.shadowBlur = 20;
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.4 + t * 0.3) + ')';
                    ctx.fillRect(beamStart, sphereY - 3, beamLen, 6);
                    ctx.restore();
                    for (let i = 0; i < 10; i++) {
                        const bx = beamStart + Math.random() * beamLen;
                        const by = sphereY + (Math.random() - 0.5) * beamWidth;
                        vp(bx, by, 2 + Math.random() * 3, '#fde047', 8);
                    }
                    ctx.save();
                    ctx.strokeStyle = 'rgba(250, 204, 21, ' + (0.2 * (1 - t)) + ')';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#facc15';
                    ctx.shadowBlur = 20;
                    ctx.beginPath();
                    ctx.arc(sphereX, sphereY, 60 + t * 40, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }

                // ===== PHASE 4: BEAM TRAVELS + IMPACT (0.62 - 0.80) =====
                else if (pp < 0.80) {
                    const t = (pp - 0.62) / 0.18;
                    const beamX = sphereX;
                    const beamEnd = sphereX + 100 + t * (canvas.width - sphereX + 50);
                    const beamWidth = 16 + t * 10;
                    const grad = ctx.createLinearGradient(beamX, 0, beamEnd, 0);
                    grad.addColorStop(0, 'rgba(234, 179, 8, 0.9)');
                    grad.addColorStop(0.3, 'rgba(250, 204, 21, 0.8)');
                    grad.addColorStop(0.7, 'rgba(253, 224, 71, 0.5)');
                    grad.addColorStop(1, 'rgba(234, 179, 8, 0.1)');
                    ctx.save();
                    ctx.shadowColor = '#eab308';
                    ctx.shadowBlur = 50;
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.moveTo(beamX, sphereY - beamWidth / 2);
                    ctx.lineTo(beamEnd, sphereY - beamWidth * 0.3);
                    ctx.lineTo(beamEnd, sphereY + beamWidth * 0.3);
                    ctx.lineTo(beamX, sphereY + beamWidth / 2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                    ctx.save();
                    ctx.shadowColor = '#fff';
                    ctx.shadowBlur = 30;
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.3 + t * 0.3) + ')';
                    ctx.fillRect(beamX, sphereY - 4, beamEnd - beamX, 8);
                    ctx.restore();
                    const impactR = 10 + t * 50;
                    vp(beamEnd, sphereY, impactR + 25, 'rgba(234, 179, 8, ' + (0.05 + t * 0.1) + ')', 55);
                    vp(beamEnd, sphereY, impactR, 'rgba(250, 204, 21, ' + (0.2 + t * 0.4) + ')', 40);
                    vp(beamEnd, sphereY, impactR * 0.5, 'rgba(253, 224, 71, ' + (t * 0.4) + ')', 25);
                    vp(beamEnd, sphereY, impactR * 0.2, 'rgba(255, 255, 255, ' + (t * 0.5) + ')', 20);
                    for (let i = 0; i < 25; i++) {
                        const a = Math.random() * 6.28;
                        const d = impactR * (0.2 + Math.random() * 1.0);
                        vp(beamEnd + Math.cos(a) * d, sphereY + Math.sin(a) * d, 2 + Math.random() * 5, i % 3 === 0 ? '#fde047' : '#facc15', 12);
                    }
                    const gradAlpha = 0.08 * t;
                    ctx.save();
                    ctx.fillStyle = 'rgba(234, 179, 8, ' + gradAlpha + ')';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    const grad2 = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
                    grad2.addColorStop(0, 'rgba(234, 179, 8, 0)');
                    grad2.addColorStop(1, 'rgba(234, 179, 8, ' + (0.12 * t) + ')');
                    ctx.save();
                    ctx.fillStyle = grad2;
                    ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
                    ctx.restore();
                    const shakeIntensity = 3 + t * 6;
                    document.querySelectorAll('#pergunta, #opcoes, .header-info').forEach(el => {
                        el.style.transform = 'translate(' + (Math.random() - 0.5) * shakeIntensity + 'px, ' + (Math.random() - 0.5) * shakeIntensity + 'px)';
                    });
                    const perguntaEl = document.getElementById('pergunta');
                    if (perguntaEl && t > 0.2) {
                        const blurP = (t - 0.2) / 0.8;
                        perguntaEl.style.opacity = 1 - blurP * 0.6;
                        perguntaEl.style.filter = 'blur(' + blurP * 6 + 'px)';
                    }
                }

                // ===== PHASE 5: EXPLOSION + YELLOW GRADIENT PEAK (0.80 - 0.93) =====
                else if (pp < 0.93) {
                    const t = (pp - 0.80) / 0.13;
                    const blastX = sphereX + 100 + 0.85 * (canvas.width - sphereX + 50);
                    const blastY = sphereY;
                    const blastR = 20 + t * 100;
                    vp(blastX, blastY, blastR + 30, 'rgba(234, 179, 8, ' + (0.06 + t * 0.06) + ')', 60);
                    vp(blastX, blastY, blastR, 'rgba(250, 204, 21, ' + (0.2 + t * 0.3) + ')', 50);
                    vp(blastX, blastY, blastR * 0.6, 'rgba(253, 224, 71, ' + (0.3 + t * 0.2) + ')', 35);
                    vp(blastX, blastY, blastR * 0.2, 'rgba(255, 255, 255, ' + (0.5 * (1 - t * 0.5)) + ')', 30);
                    ctx.save();
                    for (let i = 0; i < 4; i++) {
                        const ringR = blastR + i * 15 + t * 25;
                        ctx.strokeStyle = 'rgba(250, 204, 21, ' + (0.2 * (1 - i * 0.2) * (1 - t * 0.3)) + ')';
                        ctx.lineWidth = 2 + i;
                        ctx.shadowColor = '#facc15';
                        ctx.shadowBlur = 20;
                        ctx.beginPath();
                        ctx.arc(blastX, blastY, ringR, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    const peakAlpha = 0.08 + 0.10 * (1 - t);
                    ctx.save();
                    ctx.fillStyle = 'rgba(234, 179, 8, ' + peakAlpha + ')';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    const grad3 = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
                    grad3.addColorStop(0, 'rgba(234, 179, 8, 0)');
                    grad3.addColorStop(1, 'rgba(234, 179, 8, ' + (0.15 * (1 - t * 0.5)) + ')');
                    ctx.save();
                    ctx.fillStyle = grad3;
                    ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6);
                    ctx.restore();
                    for (let i = 0; i < 30; i++) {
                        const a = Math.random() * 6.28;
                        const d = blastR * (0.2 + Math.random() * 1.2);
                        vp(blastX + Math.cos(a) * d, blastY + Math.sin(a) * d, 2 + Math.random() * 5, '#facc15', 8);
                    }
                    const perguntaEl = document.getElementById('pergunta');
                    if (perguntaEl) {
                        perguntaEl.style.opacity = Math.max(0, 0.4 - t * 0.4);
                        perguntaEl.style.filter = 'blur(' + (6 + t * 8) + 'px)';
                    }
                }

                // ===== PHASE 6: FADEOUT + YELLOW CORNER EFFECT + AUTO PROXIMA (0.93 - 1.00) =====
                else {
                    const t = (pp - 0.93) / 0.07;
                    vp(sphereX, sphereY, 20 * (1 - t), 'rgba(250, 204, 21, ' + (0.15 * (1 - t)) + ')', 25);
                    // Yellow corner effect (bottom-right)
                    ctx.save();
                    const cornerGrad = ctx.createRadialGradient(
                        canvas.width, canvas.height, 0,
                        canvas.width, canvas.height, canvas.width * 0.6
                    );
                    cornerGrad.addColorStop(0, 'rgba(250, 204, 21, ' + (0.35 * (1 - t * 0.3)) + ')');
                    cornerGrad.addColorStop(0.4, 'rgba(234, 179, 8, ' + (0.15 * (1 - t * 0.3)) + ')');
                    cornerGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
                    ctx.fillStyle = cornerGrad;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    ctx.save();
                    ctx.globalAlpha = t * 0.3;
                    const fadeGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
                    fadeGrad.addColorStop(0, '#1a1a2e');
                    fadeGrad.addColorStop(0.5, '#1e1e2e');
                    fadeGrad.addColorStop(1, '#0a0a1e');
                    ctx.fillStyle = fadeGrad;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    if (t > 0.5) {
                        document.querySelectorAll('#pergunta, #opcoes, .header-info').forEach(el => {
                            el.style.transform = '';
                            el.style.opacity = '';
                            el.style.filter = '';
                        });
                    }
                }
                break;
            }
            case 'itachi': {
                const rPhase = progress < 0.2 ? 0 : progress < 0.6 ? 1 : 2;
                const pp = rPhase === 0 ? progress / 0.2 : rPhase === 1 ? (progress - 0.2) / 0.4 : (progress - 0.6) / 0.4;
                if (rPhase === 0) {
                    drawCircle(cx, cy, 5 + pp * 15, 'rgba(204, 51, 51, ' + (0.3 + pp * 0.5) + ')', 30);
                } else if (rPhase === 1) {
                    const r = 40 + Math.sin(pp * 3) * 5;
                    drawCircle(cx, cy, r, 'rgba(204, 51, 51, 0.6)', 40);
                    ctx.save();
                    ctx.strokeStyle = '#1a1a1a';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r - 5, 0, 6.28);
                    ctx.stroke();
                    ctx.restore();
                    const tomoeAngle = pp * 4;
                    for (let i = 0; i < 3; i++) {
                        const a = i * 2.09 + tomoeAngle;
                        const tx = cx + Math.cos(a) * (r * 0.6);
                        const ty = cy + Math.sin(a) * (r * 0.6);
                        drawCircle(tx, ty, 6 + Math.sin(pp * 6 + i) * 2, '#1a1a1a', 10);
                        ctx.save();
                        ctx.strokeStyle = '#cc3333';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(tx, ty, 8, 0, 6.28);
                        ctx.stroke();
                        ctx.restore();
                    }
                    drawCircle(cx, cy, 8, '#1a1a1a', 15);
                } else {
                    const r = 40 * (1 - pp * 0.3);
                    ctx.save();
                    ctx.globalAlpha = 1 - pp;
                    drawCircle(cx, cy, r, 'rgba(204, 51, 51, ' + (0.5 * (1 - pp)) + ')', 30);
                    ctx.strokeStyle = 'rgba(204, 51, 51, ' + (0.3 * (1 - pp)) + ')';
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 3; i++) {
                        const a = i * 2.09 + pp * 2;
                        ctx.beginPath();
                        ctx.arc(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, 6, 0, 6.28);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
                break;
            }
            case 'meliodas': {
                const melDur = 3800;
                const pp = Math.min(1, elapsed / melDur);
                const mx = startX + 20;
                const my = startY;

                function melParticle(x, y, size, color, blur) {
                    ctx.save();
                    ctx.fillStyle = color;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = blur || 20;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // ===== PHASE 0: DARK AURA BUILDUP (0.00 - 0.12) =====
                if (pp < 0.12) {
                    const t = pp / 0.12;
                    const radius = 5 + t * 30;
                    melParticle(mx, my, radius + 15, 'rgba(45, 27, 78, ' + (0.08 * t) + ')', 40);
                    melParticle(mx, my, radius, 'rgba(30, 15, 50, ' + (0.2 + t * 0.3) + ')', 30);
                    melParticle(mx, my, radius * 0.5, 'rgba(80, 30, 120, ' + (t * 0.4) + ')', 20);
                    ctx.save();
                    ctx.strokeStyle = 'rgba(80, 30, 120, ' + (0.2 * t) + ')';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#2d1b4e';
                    ctx.shadowBlur = 15;
                    for (let i = 0; i < 6; i++) {
                        const a = i * 1.047 + t * 0.5;
                        const len = 10 + t * 25;
                        ctx.beginPath();
                        ctx.moveTo(mx, my);
                        ctx.quadraticCurveTo(mx + Math.cos(a) * len * 0.7, my + Math.sin(a) * len * 0.7, mx + Math.cos(a) * len, my + Math.sin(a) * len);
                        ctx.stroke();
                    }
                    ctx.restore();
                    melParticle(mx, my, 3, 'rgba(180, 50, 50, ' + (0.3 + t * 0.5) + ')', 25);
                }

                // ===== PHASE 1: DARK SWORD FORMS (0.12 - 0.30) =====
                else if (pp < 0.30) {
                    const t = (pp - 0.12) / 0.18;
                    const bladeLen = 10 + t * 60;
                    const bladeX = mx + 20;
                    const bladeY = my - 10;
                    melParticle(bladeX, bladeY - bladeLen * 0.5, 3 + t * 5, 'rgba(60, 20, 100, ' + (0.3 + t * 0.4) + ')', 25);
                    ctx.save();
                    ctx.strokeStyle = 'rgba(120, 40, 180, ' + (0.3 + t * 0.5) + ')';
                    ctx.lineWidth = 2 + t * 3;
                    ctx.shadowColor = '#2d1b4e';
                    ctx.shadowBlur = 20;
                    ctx.beginPath();
                    ctx.moveTo(bladeX - 4, bladeY);
                    ctx.lineTo(bladeX, bladeY - bladeLen);
                    ctx.lineTo(bladeX + 4, bladeY);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(20, 10, 40, ' + (0.3 + t * 0.4) + ')';
                    ctx.shadowBlur = 0;
                    ctx.fill();
                    ctx.restore();
                    for (let i = 0; i < 6 * t; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const d = 5 + Math.random() * 15;
                        melParticle(bladeX + Math.cos(a) * d, bladeY - bladeLen * 0.5 + Math.sin(a) * d, 2 + Math.random() * 3, '#3a1a6e', 10);
                    }
                }

                // ===== PHASE 2: DARKNESS CONCENTRATES (0.30 - 0.45) =====
                else if (pp < 0.45) {
                    const t = (pp - 0.30) / 0.15;
                    const bladeX = mx + 20;
                    const bladeY = my - 10;
                    const bladeLen = 70;
                    const tipX = bladeX;
                    const tipY = bladeY - bladeLen;
                    const orbR = 5 + t * 20;
                    melParticle(tipX, tipY, orbR + 12, 'rgba(45, 20, 80, ' + (0.1 + t * 0.15) + ')', 40);
                    melParticle(tipX, tipY, orbR, 'rgba(30, 10, 60, ' + (0.3 + t * 0.4) + ')', 30);
                    melParticle(tipX, tipY, orbR * 0.5, 'rgba(100, 40, 160, ' + (t * 0.5) + ')', 20);
                    ctx.save();
                    ctx.strokeStyle = 'rgba(80, 30, 140, ' + (0.25 * t) + ')';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#2d1b4e';
                    ctx.shadowBlur = 12;
                    for (let i = 0; i < 3; i++) {
                        const pulseR = orbR + i * 8 + Math.sin(t * 10 + i) * 4;
                        ctx.beginPath();
                        ctx.arc(tipX, tipY, pulseR, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    for (let i = 0; i < 15; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const d = 20 + (1 - t) * 40;
                        melParticle(tipX + Math.cos(a) * d, tipY + Math.sin(a) * d, 2 + Math.random() * 3, '#4a1a7e', 8);
                    }
                }

                // ===== PHASE 3: THE BLACK SLASH SWING (0.45 - 0.60) =====
                else if (pp < 0.60) {
                    const t = (pp - 0.45) / 0.15;
                    const arcX = mx + 50 + t * 200;
                    const arcY = my - 30 + Math.sin(t * Math.PI) * 60;
                    const arcRadius = 40 + t * 80;
                    ctx.save();
                    ctx.shadowColor = '#1a0a2e';
                    ctx.shadowBlur = 50;
                    ctx.strokeStyle = 'rgba(30, 10, 60, ' + (0.6 + t * 0.3) + ')';
                    ctx.lineWidth = 15 + t * 20;
                    ctx.beginPath();
                    ctx.arc(arcX, arcY, arcRadius, -Math.PI * 0.8 + t * 0.5, Math.PI * 0.3 + t * 0.5);
                    ctx.stroke();
                    ctx.shadowBlur = 30;
                    ctx.strokeStyle = 'rgba(80, 30, 140, ' + (0.3 + t * 0.4) + ')';
                    ctx.lineWidth = 6 + t * 8;
                    ctx.beginPath();
                    ctx.arc(arcX, arcY, arcRadius, -Math.PI * 0.8 + t * 0.5, Math.PI * 0.3 + t * 0.5);
                    ctx.stroke();
                    ctx.shadowBlur = 20;
                    ctx.strokeStyle = 'rgba(180, 140, 220, ' + (t * 0.3) + ')';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(arcX, arcY, arcRadius, -Math.PI * 0.8 + t * 0.5, Math.PI * 0.3 + t * 0.5);
                    ctx.stroke();
                    ctx.restore();
                    for (let i = 0; i < 20; i++) {
                        const angle = -Math.PI * 0.8 + t * 0.5 + (Math.random() - 0.5) * 0.4;
                        const dist = arcRadius * (0.5 + Math.random() * 0.5);
                        const px = arcX + Math.cos(angle) * dist;
                        const py = arcY + Math.sin(angle) * dist;
                        melParticle(px, py, 2 + Math.random() * 4, i % 3 === 0 ? '#6a2aae' : '#2a0a4e', 12);
                    }
                    const shakeIntensity = 4 + t * 6;
                    document.querySelectorAll('#pergunta, #opcoes, .header-info').forEach(el => {
                        el.style.transform = 'translate(' + (Math.random() - 0.5) * shakeIntensity + 'px, ' + (Math.random() - 0.5) * shakeIntensity + 'px)';
                    });
                }

                // ===== PHASE 4: SLASH WAVE TRAVELS (0.60 - 0.78) =====
                else if (pp < 0.78) {
                    const t = (pp - 0.60) / 0.18;
                    const waveX = mx + 100 + t * (canvas.width - mx - 100);
                    const waveY = my - 30 + Math.sin(t * Math.PI * 2) * 40;
                    const shockR = 20 + t * 40;
                    melParticle(waveX, waveY, shockR + 20, 'rgba(30, 10, 60, ' + (0.1 + t * 0.1) + ')', 45);
                    melParticle(waveX, waveY, shockR, 'rgba(45, 20, 80, ' + (0.3 + t * 0.2) + ')', 35);
                    melParticle(waveX, waveY, shockR * 0.4, 'rgba(100, 50, 160, ' + (t * 0.4) + ')', 20);
                    ctx.save();
                    ctx.strokeStyle = 'rgba(60, 20, 100, ' + (0.3 * t) + ')';
                    ctx.lineWidth = 1 + t * 2;
                    ctx.shadowColor = '#1a0a2e';
                    ctx.shadowBlur = 10;
                    for (let i = 0; i < 12; i++) {
                        const cx = waveX + (Math.random() - 0.5) * 60;
                        const cy = waveY + (Math.random() - 0.5) * 60;
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        for (let j = 0; j < 3; j++) {
                            ctx.lineTo(cx + (Math.random() - 0.5) * 30, cy + (Math.random() - 0.5) * 30);
                        }
                        ctx.stroke();
                    }
                    ctx.restore();
                    for (let i = 0; i < 25; i++) {
                        const tx = waveX - Math.random() * 100;
                        const ty = waveY + (Math.random() - 0.5) * 80;
                        melParticle(tx, ty, 2 + Math.random() * 5, '#2a0a4e', 10);
                    }
                }

                // ===== PHASE 5: DARKNESS CONSUMES (0.78 - 0.93) =====
                else if (pp < 0.93) {
                    const t = (pp - 0.78) / 0.15;
                    const centerX = mx + 200;
                    const centerY = my - 20;
                    const voidR = 10 + t * 150;
                    melParticle(centerX, centerY, voidR + 30, 'rgba(10, 5, 20, ' + (0.05 + t * 0.1) + ')', 50);
                    melParticle(centerX, centerY, voidR, 'rgba(15, 5, 30, ' + (0.2 + t * 0.3) + ')', 40);
                    melParticle(centerX, centerY, voidR * 0.6, 'rgba(30, 15, 50, ' + (t * 0.3) + ')', 25);
                    ctx.save();
                    for (let i = 0; i < 5; i++) {
                        const rOff = i * 12 + t * 20;
                        ctx.strokeStyle = 'rgba(80, 30, 140, ' + (0.15 * (1 - i * 0.15) * t) + ')';
                        ctx.lineWidth = 2 + i * 0.5;
                        ctx.shadowColor = '#2d1b4e';
                        ctx.shadowBlur = 20;
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, voidR * 0.3 + rOff, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.restore();
                    for (let i = 0; i < 30; i++) {
                        const a = Math.random() * Math.PI * 2;
                        const d = voidR * (0.2 + Math.random() * 0.8);
                        melParticle(centerX + Math.cos(a) * d, centerY + Math.sin(a) * d, 2 + Math.random() * 4, '#1a0a2e', 8);
                    }
                    const perguntaEl = document.getElementById('pergunta');
                    if (perguntaEl && t > 0.3) {
                        const progress = (t - 0.3) / 0.7;
                        if (progress > 0.3) {
                            perguntaEl.style.opacity = 1 - (progress - 0.3) * 1.5;
                            perguntaEl.style.filter = 'blur(' + (progress - 0.3) * 10 + 'px)';
                        }
                    }
                }

                // ===== PHASE 6: FADEOUT + AUTO PROXIMA (0.93 - 1.00) =====
                else {
                    const t = (pp - 0.93) / 0.07;
                    melParticle(mx + 50, my - 10, 20 * (1 - t), 'rgba(30, 15, 50, ' + (0.15 * (1 - t)) + ')', 25);
                    ctx.save();
                    ctx.globalAlpha = t * 0.5;
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                    if (t > 0.5) {
                        document.querySelectorAll('#pergunta, #opcoes, .header-info').forEach(el => {
                            el.style.transform = '';
                            el.style.opacity = '';
                            el.style.filter = '';
                        });
                    }
                }
                break;
            }
        }

        if (progress < 1) {
            requestAnimationFrame(animar);
        } else {
            canvas.classList.remove('ativo');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            document.querySelectorAll('#pergunta, #opcoes, .header-info').forEach(el => {
                el.style.transform = '';
                el.style.opacity = '';
                el.style.filter = '';
            });
        }
    }
    animar();
}

// ===== NAVIGATION AND UI =====
function mostrarAba(aba) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('ativa'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('ativa'));
    const tab = document.getElementById('tab' + aba);
    if (tab) tab.classList.add('ativa');
    const view = document.getElementById('view' + aba);
    if (view) view.classList.add('ativa');
    if (aba === 'Loja') renderizarLoja();
    if (aba === 'Inventario') renderizarInventario();
    if (aba === 'Perfil') renderizarPerfil();
}

function atualizarHUD() {
    const moedasEl = document.getElementById('hudMoedas');
    if (moedasEl) moedasEl.innerText = '🪙 ' + (user ? user.moedas : 0);

    const tituloEl = document.getElementById('hudTitulo');
    if (tituloEl) {
        const tituloId = user ? user.equipado.titulo : null;
        const titulo = tituloId ? lojaTitulos.find(t => t.id === tituloId) : null;
        if (titulo) {
            tituloEl.style.display = 'inline';
            tituloEl.innerText = titulo.icone + ' ' + titulo.nome;
            tituloEl.style.borderColor = titulo.cor || '#8b0000';
        } else {
            tituloEl.style.display = 'none';
        }
    }

    const nivelEl = document.getElementById('hudNivel');
    if (nivelEl) nivelEl.innerText = 'LV ' + (user ? user.nivel : 1);

    const barra = document.getElementById('hudBarra');
    const xpTexto = document.getElementById('hudXpTexto');
    if (user) {
        const pct = user.xpProximoNivel > 0 ? Math.min(100, Math.floor((user.xp / user.xpProximoNivel) * 100)) : 100;
        if (barra) barra.style.width = pct + '%';
        if (xpTexto) xpTexto.innerText = (user.nivel >= NIVEL_MAX ? 'MAX' : user.xp + '/' + user.xpProximoNivel + ' XP');
    } else {
        if (barra) barra.style.width = '0%';
        if (xpTexto) xpTexto.innerText = '0/0 XP';
    }

    const streakEl = document.getElementById('hudStreak');
    if (streakEl) {
        if (user && user.streak > 0) {
            streakEl.style.display = 'inline';
            streakEl.innerText = '🔥 ' + user.streak;
        } else {
            streakEl.style.display = 'none';
        }
    }

    const boostEl = document.getElementById('hudBoost');
    if (boostEl) {
        if (boostAtual) {
            const boostNome = lojaBoosts.find(b => b.id === boostAtual);
            boostEl.style.display = 'inline';
            boostEl.innerText = '⚡ ' + (boostNome ? boostNome.nome : boostAtual) + ' ' + boostTempoRestante + 's';
        } else {
            boostEl.style.display = 'none';
        }
    }

    const rankEl = document.getElementById('hudRank');
    if (rankEl && user) {
        const rankId = user.equipado.rank;
        if (rankId) {
            const rank = lojaRanks.find(r => r.id === rankId);
            if (rank) {
                rankEl.innerText = rank.icone + ' ' + rank.nome;
                if (rank.cor) rankEl.style.color = rank.cor;
            } else {
                rankEl.innerText = '';
            }
        } else {
            rankEl.innerText = '';
        }
    }

    atualizarCharWidget();
}

function atualizarCharWidget() {
    const widget = document.getElementById('charWidget');
    if (!widget) return;
    const personId = user.equipado.personagem;
    if (personId && CHARACTERS_MAP[personId]) {
        widget.style.display = 'block';
        const nomeEl = document.getElementById('charWidgetNome');
        const poderEl = document.getElementById('charWidgetPoder');
        const imgEl = document.getElementById('charWidgetImg');
        const char = CHARACTERS_MAP[personId];
        if (imgEl) { imgEl.src = char.image; imgEl.alt = char.name; }
        if (nomeEl) nomeEl.innerText = char.name;
        if (poderEl && poderesDisponiveis[personId]) {
            const usosTexto = poderUsosRestantes > 1 ? ' (' + poderUsosRestantes + 'x)' : '';
            poderEl.innerText = poderesDisponiveis[personId].icone + ' ' + poderesDisponiveis[personId].nome + usosTexto;
            if (poderUsosRestantes <= 0 || !quizAtivo) {
                poderEl.disabled = true;
            } else {
                poderEl.disabled = false;
            }
        }
        const passiva = getPassiva(personId);
        const passivaEl = document.getElementById('charWidgetPassiva');
        if (passivaEl) passivaEl.innerText = passiva ? passiva.desc : '';

        const cargaEl = document.getElementById('charWidgetCarga');
        if (cargaEl && poderEl) {
            const maxUsos = getMaxPoderUsos();
            const atual = poderUsosRestantes;
            const pct = maxUsos > 0 ? (atual / maxUsos) * 100 : 0;
            cargaEl.style.width = pct + '%';
            cargaEl.style.background = atual > 0 ? 'linear-gradient(90deg, #9b59b6, #a855f7)' : '#333';
        }
    } else {
        widget.style.display = 'none';
    }
}

// ===== SHOP RENDER =====
function renderizarLoja() {
    const container = document.getElementById('lojaConteudo');
    if (!container) return;
    document.getElementById('lojaSaldo').innerText = user ? user.moedas : 0;
    let html = '';

    html += '<h3 class="secao-titulo">⚡ Boosts</h3>';
    html += '<div class="loja-categorias">';
    lojaBoosts.forEach(b => { html += cardLoja(b, 'boosts'); });
    html += '</div>';

    html += '<h3 class="secao-titulo">🎭 Personagens</h3>';
    html += '<div class="loja-categorias">';
    for (const char of CHARACTERS) {
        const poder = poderesDisponiveis[char.id];
        const item = {
            id: char.id, nome: char.name, desc: poder ? poder.desc : 'Personagem', preco: char.price, icone: '🎭'
        };
        html += cardLoja(item, 'personagens');
    }
    html += '</div>';

    html += '<h3 class="secao-titulo">🥇 Ranks</h3>';
    html += '<div class="loja-categorias">';
    lojaRanks.forEach(r => { html += cardLoja(r, 'ranks'); });
    html += '</div>';

    html += '<h3 class="secao-titulo">📜 Posts</h3>';
    html += '<div class="loja-categorias">';
    lojaPosts.forEach(p => { html += cardLoja(p, 'posts'); });
    html += '</div>';

    html += '<h3 class="secao-titulo">🏷️ Titulos</h3>';
    html += '<div class="loja-categorias">';
    lojaTitulos.forEach(t => { html += cardLoja(t, 'titulos'); });
    html += '</div>';

    container.innerHTML = html;
}

function cardLoja(item, categoria) {
    const jaTem = user.inventario[categoria] && user.inventario[categoria].includes(item.id);
    const equipado = user.equipado[categoria.substring(0, categoria.length - 1)] === item.id || 
                     (categoria === 'personagens' && user.equipado.personagem === item.id) ||
                     (categoria === 'ranks' && user.equipado.rank === item.id) ||
                     (categoria === 'posts' && user.equipado.post === item.id) ||
                     (categoria === 'titulos' && user.equipado.titulo === item.id);
    const podeComprar = !jaTem && user.moedas >= item.preco;
    const isFree = item.preco === 0;

    const estiloCor = (categoria === 'ranks' && item.cor) ? ' style="border-color:' + item.cor + ';box-shadow:0 0 15px ' + item.cor + '22"' : 
                      (categoria === 'titulos' && item.cor) ? ' style="border-color:' + item.cor + ';box-shadow:0 0 15px ' + item.cor + '44"' : '';
    const ehPersonagem = categoria === 'personagens' && CHARACTERS_MAP[item.id];
    const clickPersonagem = ehPersonagem ? ' onclick="mostrarDetalhePersonagem(\'' + item.id + '\')"' : '';
    const charImg = ehPersonagem ? CHARACTERS_MAP[item.id].image : '';
    let html = '<div class="card-loja' + (ehPersonagem ? ' card-personagem' : '') + (categoria === 'titulos' ? ' card-titulo' : '') + '"' + estiloCor + clickPersonagem + '>';
    if (ehPersonagem) {
        html += '<div class="pixel-container"><img src="' + charImg + '" alt="' + item.nome + '" class="char-sprite char-sm" /></div>';
    } else if (categoria === 'titulos') {
        html += '<div class="titulo-strike-wrap"><div class="titulo-strike-icon">' + (item.icone || '🏷️') + '</div><div class="titulo-strike-slash"></div></div>';
    } else {
        html += '<div style="font-size:2.5rem;margin-bottom:6px">' + (item.icone || '🎁') + '</div>';
    }
    html += '<div class="card-info">';
    html += '<strong ' + ((categoria === 'ranks' || categoria === 'titulos') && item.cor ? 'style="color:' + item.cor + '"' : '') + '>' + item.nome + '</strong>';
    html += '<small>' + item.desc + '</small>';
    if (categoria === 'ranks') {
        html += '<div class="rank-mult-info" ' + (item.cor ? 'style="color:' + item.cor + '"' : '') + '>Multiplicador: x' + (item.mult || 1) + '</div>';
    }
    if (categoria === 'personagens' && poderesDisponiveis[item.id]) {
        html += '<small class="poder-info">' + poderesDisponiveis[item.id].icone + ' ' + poderesDisponiveis[item.id].nome + '</small>';
    }
    html += '</div>';

    if (categoria === 'boosts') {
        if (boostAtual === item.id) {
            html += '<span class="tag-ativo">Ativo (' + boostTempoRestante + 's)</span>';
        } else if (jaTem) {
            html += '<button onclick="ativarBoost(\'' + item.id + '\')" class="btn-equipar">Ativar</button>';
        } else if (isFree) {
            html += '<button onclick="comprarItem(\'' + item.id + '\',\'' + categoria + '\',0)" class="btn-comprar">Gratuito</button>';
        } else {
            html += '<button onclick="comprarItem(\'' + item.id + '\',\'' + categoria + '\',' + item.preco + ')" class="btn-comprar" ' + (!podeComprar ? 'disabled' : '') + '>🪙 ' + item.preco + '</button>';
        }
    } else if (equipado) {
        html += '<span class="tag-equipado">Equipado</span>';
    } else if (jaTem) {
        html += '<button onclick="equiparItem(\'' + item.id + '\',\'' + categoria + '\')" class="btn-equipar">Equipar</button>';
    } else if (isFree) {
        html += '<button onclick="comprarItem(\'' + item.id + '\',\'' + categoria + '\',0)" class="btn-comprar">Gratuito</button>';
    } else {
        html += '<button onclick="comprarItem(\'' + item.id + '\',\'' + categoria + '\',' + item.preco + ')" class="btn-comprar" ' + (!podeComprar ? 'disabled' : '') + '>🪙 ' + item.preco + '</button>';
    }

    html += '</div>';
    return html;
}

function comprarItem(id, categoria, preco) {
    if (user.moedas < preco) return;
    if (user.inventario[categoria] && user.inventario[categoria].includes(id)) return;
    
    if (!user.inventario[categoria]) user.inventario[categoria] = [];
    user.moedas -= preco;
    user.inventario[categoria].push(id);
    salvarUser();

    if (categoria === 'personagens') {
        user.equipado.personagem = id;
        salvarUser();
        setTimeout(() => mostrarDetalhePersonagem(id), 300);
    }

    notificar('✅ Comprado: ' + id + '!', '#4ade80');
    renderizarLoja();
    atualizarHUD();
}

function equiparItem(id, categoria) {
    if (!user.inventario[categoria] || !user.inventario[categoria].includes(id)) return;
    
    const key = categoria === 'personagens' ? 'personagem' : categoria === 'ranks' ? 'rank' : categoria === 'titulos' ? 'titulo' : 'post';
    user.equipado[key] = id;
    salvarUser();
    notificar('✅ Equipado: ' + id + '!', '#4ade80');
    renderizarLoja();
    atualizarHUD();
    if (categoria === 'personagens') mostrarDetalhePersonagem(id);
}

// ===== BOOST SYSTEM =====
function ativarBoost(id) {
    const boost = lojaBoosts.find(b => b.id === id);
    if (!boost || boostAtual) return;
    const idx = (user.inventario.boosts || []).indexOf(id);
    if (idx === -1) return;

    const duracoes = { boost_xp: 30, boost_moedas: 30, boost_vida: 30, boost_2x: 20, boost_triplo: 15, boost_dobro: 25 };
    const tempoTotal = duracoes[id] || 30;
    boostAtual = id;
    boostTempoRestante = tempoTotal;
    user.inventario.boosts.splice(idx, 1);
    user.boostAtivo = id;
    salvarUser();
    notificar('⚡ ' + boost.nome + ' ativado por ' + tempoTotal + 's!', '#fbbf24');
    renderizarLoja();
    atualizarHUD();

    if (boostTimerInterval) clearInterval(boostTimerInterval);
    boostTimerInterval = setInterval(() => {
        boostTempoRestante--;
        atualizarHUD();
        if (boostTempoRestante <= 0) {
            clearInterval(boostTimerInterval);
            boostTimerInterval = null;
            boostAtual = null;
            user.boostAtivo = null;
            salvarUser();
            notificar('⏱️ Boost ' + boost.nome + ' expirou!', '#f87171');
            renderizarLoja();
            atualizarHUD();
        }
    }, 1000);
}

function getBoostMultiplicadorXP() {
    if (boostAtual === 'boost_xp') return 1.5;
    if (boostAtual === 'boost_2x') return 2.0;
    if (boostAtual === 'boost_triplo') return 3.0;
    return 1.0;
}

function getBoostMultiplicadorMoedas() {
    if (boostAtual === 'boost_moedas') return 1.5;
    if (boostAtual === 'boost_dobro') return 2.0;
    return 1.0;
}

function getBoostVidaExtra() {
    if (boostAtual === 'boost_vida') return 1;
    return 0;
}

// ===== INVENTORY =====
let invAbaAtual = 'personagens';

function renderizarInventario() {
    const container = document.getElementById('invConteudo');
    if (!container) return;

    let html = '<div class="inv-tabs">';
    const abas = ['personagens', 'ranks', 'posts', 'boosts', 'titulos'];
    abas.forEach(a => {
        const nomes = { personagens: '🎭 Personagens', ranks: '🥇 Ranks', posts: '📜 Posts', boosts: '⚡ Boosts', titulos: '🏷️ Titulos' };
        html += '<button class="inv-tab ' + (invAbaAtual === a ? 'ativa' : '') + '" onclick="mudarInvAba(\'' + a + '\')">' + (nomes[a] || a) + '</button>';
    });
    html += '</div>';

    html += '<div class="inv-conteudo-tab ativa">';

    const itens = user.inventario[invAbaAtual] || [];
    if (itens.length === 0) {
        html += '<div class="vazio">Nada aqui ainda... Compre na loja!</div>';
    } else {
        html += '<div class="inv-grid">';
        itens.forEach(id => {
            let item = null;
            let nome = id;
            if (invAbaAtual === 'personagens') {
                item = CHARACTERS_MAP[id];
                nome = item ? item.name : id;
            } else if (invAbaAtual === 'ranks') {
                item = lojaRanks.find(r => r.id === id);
                nome = item ? item.nome : id;
            } else if (invAbaAtual === 'posts') {
                item = lojaPosts.find(p => p.id === id);
                nome = item ? item.nome : id;
            } else if (invAbaAtual === 'boosts') {
                item = lojaBoosts.find(b => b.id === id);
                nome = item ? item.nome : id;
            } else if (invAbaAtual === 'titulos') {
                item = lojaTitulos.find(t => t.id === id);
                nome = item ? item.nome : id;
            }

            const key = invAbaAtual === 'personagens' ? 'personagem' : invAbaAtual === 'ranks' ? 'rank' : invAbaAtual === 'titulos' ? 'titulo' : 'post';
            const equipado = user.equipado[key] === id;
            const boostAtivo = invAbaAtual === 'boosts' && boostAtual === id;
            const ehPersonagemInv = invAbaAtual === 'personagens' && CHARACTERS_MAP[id];
            const ehTituloInv = invAbaAtual === 'titulos';
            const clickPersonagemInv = ehPersonagemInv ? ' onclick="mostrarDetalhePersonagem(\'' + id + '\')"' : '';

            html += '<div class="card-inv ' + (equipado ? 'equipado' : '') + (boostAtivo ? ' boost-ativo' : '') + (ehPersonagemInv ? ' card-personagem' : '') + (ehTituloInv ? ' card-titulo' : '') + '"' + clickPersonagemInv + '>';
            if (ehPersonagemInv) {
                const char = CHARACTERS_MAP[id];
                html += '<div class="pixel-container"><img src="' + char.image + '" alt="' + nome + '" class="char-sprite char-sm" /></div>';
            } else if (ehTituloInv) {
                html += '<div class="titulo-strike-wrap"><div class="titulo-strike-icon">' + (item ? item.icone || '🏷️' : '🏷️') + '</div><div class="titulo-strike-slash"></div></div>';
            } else {
                html += '<div style="font-size:2rem;margin-bottom:4px">' + (item ? item.icone || '🎁' : '🎁') + '</div>';
            }
            html += '<div class="card-info">';
            html += '<strong>' + nome + '</strong>';
            if (item && item.desc) {
                html += '<small>' + item.desc.substring(0, 30) + '</small>';
            }
            html += '</div>';
            if (invAbaAtual === 'boosts') {
                if (boostAtual === id) {
                    html += '<span class="tag-ativo">Ativo (' + boostTempoRestante + 's)</span>';
                } else {
                    html += '<button onclick="ativarBoost(\'' + id + '\');renderizarInventario();" class="btn-equipar">Ativar</button>';
                }
            } else if (equipado) {
                html += '<span class="tag-equipado">Equipado</span>';
            } else {
                html += '<button onclick="equiparItem(\'' + id + '\',\'' + invAbaAtual + '\');renderizarInventario();" class="btn-equipar">Equipar</button>';
            }
            html += '</div>';
        });
        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
}

function mudarInvAba(aba) {
    invAbaAtual = aba;
    renderizarInventario();
}

// ===== PROFILE =====
function renderizarPerfil() {
    const container = document.getElementById('perfilConteudo');
    if (!container || !user) return;

    const rankItem = user.equipado.rank ? lojaRanks.find(r => r.id === user.equipado.rank) : null;
    const postItem = user.equipado.post ? lojaPosts.find(p => p.id === user.equipado.post) : null;
    const personItem = user.equipado.personagem ? CHARACTERS_MAP[user.equipado.personagem] : null;
    const tituloItem = user.equipado.titulo ? lojaTitulos.find(t => t.id === user.equipado.titulo) : null;

    let html = '<div class="perfil-header">';
    html += '<div class="perfil-avatar-placeholder">';
    if (personItem) {
        html += '<div class="perfil-pixel"><img src="' + personItem.image + '" alt="' + personItem.name + '" class="char-sprite char-lg" /></div>';
    } else {
        html += '👤';
    }
    html += '</div>';
    html += '<div class="perfil-info">';
    html += '<h2>Nivel ' + user.nivel + '</h2>';
    const pct = user.xpProximoNivel > 0 ? Math.min(100, Math.floor((user.xp / user.xpProximoNivel) * 100)) : 100;
    html += '<div class="xp-bar-grande"><div class="xp-bar-grande-preenchimento" style="width:' + pct + '%"></div></div>';
    html += '<div class="xp-texto">' + (user.nivel >= NIVEL_MAX ? 'MAX Nivel' : user.xp + '/' + user.xpProximoNivel + ' XP') + '</div>';
    if (rankItem) html += '<div class="rank-exibido">' + rankItem.icone + ' ' + rankItem.nome + ' (x' + rankItem.mult + ')</div>';
    if (postItem) html += '<div class="post-exibido">"' + postItem.desc + '"</div>';
    if (tituloItem) html += '<div class="titulo-exibido" style="border-color:' + (tituloItem.cor || '#8b0000') + '">' + tituloItem.icone + ' ' + tituloItem.nome + '</div>';
    html += '</div></div>';

    html += '<div class="perfil-stats">';
    html += '<div class="stat-card"><span class="stat-num">' + (user.totalAcertos) + '</span><span>Total Acertos</span></div>';
    html += '<div class="stat-card"><span class="stat-num">' + (user.totalPerguntas) + '</span><span>Total Perguntas</span></div>';
    html += '<div class="stat-card"><span class="stat-num">' + (user.totalPerguntas > 0 ? Math.round((user.totalAcertos / user.totalPerguntas) * 100) : 0) + '%</span><span>Precisao</span></div>';
    html += '<div class="stat-card"><span class="stat-num">' + user.maxStreak + '</span><span>Max Streak</span></div>';
    html += '<div class="stat-card"><span class="stat-num">' + user.moedas + '</span><span>Moedas</span></div>';
    html += '<div class="stat-card"><span class="stat-num">' + generosJogados.length + '</span><span>Generos Jogados</span></div>';
    html += '</div>';

    html += '<h3 class="secao-titulo" style="margin-top:20px">🏆 Conquistas (' + (user.conquistas || []).length + '/' + conquistas.length + ')</h3>';
    html += '<div class="inv-grid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">';
    conquistas.forEach(c => {
        const desbloqueada = (user.conquistas || []).includes(c.id);
        html += '<div class="card-inv ' + (desbloqueada ? 'equipado' : '') + '" style="opacity:' + (desbloqueada ? '1' : '0.4') + '">';
        html += '<div style="font-size:2rem;margin-bottom:4px">' + c.icone + '</div>';
        html += '<div class="card-info"><strong style="font-size:0.75rem">' + c.nome + '</strong><small style="font-size:0.6rem">' + c.desc + '</small></div>';
        html += desbloqueada ? '<span class="tag-equipado">✅</span>' : '<span style="color:rgba(255,255,255,0.3)">🔒</span>';
        html += '</div>';
    });
    html += '</div>';

    container.innerHTML = html;
}

// ===== CHARACTER PASSIVES =====
function getPassiva(personagemId) {
    const passivas = {
        naruto: { nome: 'Determinacao', desc: '+5% XP em todas as fontes', aplicar: (xp) => Math.floor(xp * 1.05) },
        goku: { nome: 'Super Saiyajin', desc: '+1 vida no inicio do quiz', aplicar: null },
        luffy: { nome: 'Rei dos Piratas', desc: '+10% moedas ganhas', aplicarMoedas: (m) => Math.floor(m * 1.1) },
        pikachu: { nome: 'Eletricidade', desc: '+3s extra no timer', aplicar: null },
        tanjiro: { nome: 'Folego Constante', desc: '10% chance de nao perder vida ao errar', aplicar: null },
        gojo: { nome: 'Seis Olhos', desc: 'Poder pode ser usado 2 vezes por quiz', aplicar: null },
        mikasa: { nome: 'Lealdade', desc: '+2 moedas extras por acerto', aplicar: null },
        sailor: { nome: 'Luar', desc: 'Comeca cada quiz com todas as vidas +1 extra', aplicar: null },
        vegeta: { nome: 'Principe Sayajin', desc: '+15% XP em todas as fontes', aplicar: (xp) => Math.floor(xp * 1.15) },
        itachi: { nome: 'Sharingan', desc: 'Uma opcao errada e eliminada automaticamente', aplicar: null },
        meliodas: { nome: 'Full Counter', desc: 'Chance de refletir o dano e nao perder vida ao errar', aplicar: null }
    };
    return passivas[personagemId] || null;
}

function aplicarPassivaInicioQuiz() {
    const personId = user.equipado.personagem;
    if (!personId) return;
    const passiva = getPassiva(personId);
    if (!passiva) return;
    if (personId === 'goku' || personId === 'sailor') {
        const extra = personId === 'sailor' ? 1 : 0;
        vidas = Math.min(vidas + extra + (personId === 'goku' ? 1 : 0), 5);
        atualizarVidas();
    }
}

function aplicarBonusPassivaXP(xp) {
    const personId = user.equipado.personagem;
    if (!personId) return xp;
    const passiva = getPassiva(personId);
    if (!passiva || !passiva.aplicar) return xp;
    return passiva.aplicar(xp);
}

function aplicarBonusPassivaMoedas(moedas) {
    const personId = user.equipado.personagem;
    if (!personId) return moedas;
    const passiva = getPassiva(personId);
    if (passiva && passiva.aplicarMoedas) return passiva.aplicarMoedas(moedas);
    if (personId === 'mikasa') return moedas + 2;
    return moedas;
}

function getTimerBonusPassiva() {
    const personId = user.equipado.personagem;
    if (personId === 'pikachu') return 3;
    return 0;
}

function getMaxPoderUsos() {
    const personId = user.equipado.personagem;
    if (personId === 'gojo') return 2;
    return 1;
}

function getChanceSalvarVida() {
    const personId = user.equipado.personagem;
    if (personId === 'tanjiro' && Math.random() < 0.1) return true;
    return false;
}

function getChanceRefletirDano() {
    const personId = user.equipado.personagem;
    if (personId === 'meliodas' && Math.random() < 0.1) return true;
    return false;
}

// ===== DAILY REWARD =====
function verificarRecompensaDiaria() {
    const hoje = new Date().toDateString();
    const ultimo = localStorage.getItem('quizMastersDaily');
    if (ultimo === hoje) return;
    const bonusXP = 50 + Math.floor(Math.random() * 50);
    const bonusMoedas = 20 + Math.floor(Math.random() * 30);
    ganharXp(bonusXP);
    ganharMoedas(bonusMoedas);
    localStorage.setItem('quizMastersDaily', hoje);
    notificar('🎁 Recompensa Diaria: +' + bonusXP + ' XP e +' + bonusMoedas + ' moedas!', '#ffd700');
}

// ===== NOTIFICATION =====
let notificacaoTimer = null;

function notificar(texto, cor) {
    let el = document.getElementById('notificacaoGlobal');
    if (!el) {
        el = document.createElement('div');
        el.id = 'notificacaoGlobal';
        el.className = 'notificacao';
        document.body.appendChild(el);
    }
    if (notificacaoTimer) clearTimeout(notificacaoTimer);
    el.innerText = texto;
    el.style.borderLeftColor = cor || '#4ade80';
    el.classList.add('show');
    notificacaoTimer = setTimeout(() => {
        el.classList.remove('show');
    }, 3000);
}

// ===== INICIALIZACAO =====
carregarUser();
verificarRecompensaDiaria();
renderizarGeneros();
resetarQuiz();
atualizarHUD();
