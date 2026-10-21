import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCharacterFromInput,
  calculateAudioProgressPercent,
  countWords,
  extractUniqueAttributes,
  filterCharacters,
  formatAudioTime,
  formatCharacterExportMarkdown,
  isValidHttpUrl,
  normalizeVietnamese,
  toggleUserFavorite,
  validateCharacterForm,
} from './characterLogic.ts';
import type { CharacterProfile, UserProfilePreference } from '../types/character.ts';

const sampleCharacters: CharacterProfile[] = [
  {
    id: 'c1',
    code: 'TV-01',
    name: 'Linh Đan',
    tags: ['Chữa lành', 'Bí ẩn', 'Đêm mưa'],
    shortHook: 'Người giữ tiệm thuốc cổ chỉ mở cửa khi sương mù phủ kín bến sông.',
    backstory: ['Linh Đan kế thừa hiệu thuốc Bách Thảo từ ngoại tổ phụ.'],
    personalityNotes: 'Ôn nhu nhưng giữ khoảng cách.',
    openingMessage: '*Tiếng chuông gió bằng đồng khẽ ngân vang khi cánh cửa gỗ hé mở.*',
    characterLink: 'https://character.ai/chat/linh-dan-apothecary',
    platformName: 'Character.AI',
    creatorHandle: '@SonTraArchive',
    avatarKey: 'linh_dan',
    accentHex: '#E4E4E7',
  },
  {
    id: 'c2',
    code: 'TV-02',
    name: 'Kaelen Vex',
    tags: ['Phá án', 'Noir', 'Bí ẩn'],
    shortHook: 'Chuyên gia truy tìm những đoạn ký ức bị đánh cắp trong giới thượng lưu.',
    backstory: ['Cựu thanh tra sở cảnh sát cảng Noctis.'],
    personalityNotes: 'Quan sát tỉ mỉ, ít nói.',
    openingMessage: '"Cậu đến muộn mười hai phút," Kaelen vừa nói vừa gập chiếc đồng hồ quả quýt.',
    characterLink: 'https://janitorai.com/characters/kaelen-vex-noctis',
    platformName: 'JanitorAI',
    creatorHandle: '@NoctisChronicle',
    avatarKey: 'kaelen',
    accentHex: '#E4E4E7',
  },
];

test('normalizeVietnamese strips diacritics and normalizes đ/Đ', () => {
  assert.equal(normalizeVietnamese('Linh Đan Phố Cổ'), 'linh dan pho co');
  assert.equal(normalizeVietnamese('  BÍ ẨN  '), 'bi an');
});

test('filterCharacters filters by creator, tags, keyword, and favorites', () => {
  const byCreator = filterCharacters(sampleCharacters, {
    selectedCreator: '@SonTraArchive',
    searchQuery: '',
  });
  assert.equal(byCreator.length, 1);
  assert.equal(byCreator[0].id, 'c1');

  const bySharedTag = filterCharacters(sampleCharacters, {
    selectedTags: ['Bí ẩn'],
    searchQuery: '',
  });
  assert.equal(bySharedTag.length, 2);

  const byMultipleTags = filterCharacters(sampleCharacters, {
    selectedTags: ['Bí ẩn', 'Chữa lành'],
    searchQuery: '',
  });
  assert.equal(byMultipleTags.length, 1);
  assert.equal(byMultipleTags[0].id, 'c1');

  const byCreatorKeyword = filterCharacters(sampleCharacters, {
    searchQuery: 'noctischronicle',
  });
  assert.equal(byCreatorKeyword.length, 1);
  assert.equal(byCreatorKeyword[0].id, 'c2');
});

test('extractUniqueAttributes and toggleUserFavorite work accurately per user', () => {
  const attrs = extractUniqueAttributes(sampleCharacters);
  assert.deepEqual(attrs.creators, ['@SonTraArchive', '@NoctisChronicle']);
  assert.ok(attrs.tags.includes('Chữa lành'));

  const initialUsers: UserProfilePreference[] = [
    { id: 'u1', name: 'Lữ Khách A', favoriteCharacterIds: ['c1'] },
    { id: 'u2', name: 'Lữ Khách B', favoriteCharacterIds: [] },
  ];

  const afterAddForU2 = toggleUserFavorite(initialUsers, 'u2', 'c2');
  assert.deepEqual(afterAddForU2[0].favoriteCharacterIds, ['c1']);
  assert.deepEqual(afterAddForU2[1].favoriteCharacterIds, ['c2']);

  const afterRemoveForU1 = toggleUserFavorite(afterAddForU2, 'u1', 'c1');
  assert.deepEqual(afterRemoveForU1[0].favoriteCharacterIds, []);
});

test('validateCharacterForm and buildCharacterFromInput work with creatorHandle, tags, and personal info', () => {
  const created = buildCharacterFromInput(
    {
      name: 'Huyền Vũ',
      birthday: '15/10',
      age: '25 tuổi',
      zodiac: 'Thiên Yết',
      personality: 'Điềm tĩnh, thâm trầm, chiều chuộng',
      tagsText: 'Kiếm đạo, Lạnh lùng, Tuyết sơn',
      backstoryText: 'Đoạn một của tiểu sử nhân vật.\n\nĐoạn hai của tiểu sử nhân vật.',
      personalityNotes: 'Trọng chữ tín, luôn đứng đợi dưới hiên mưa.',
      openingMessage: '*Tuyết rơi phủ trắng mái đình cổ, tiếng kiếm chạm vỏ khẽ vang.*',
      characterLink: 'https://character.ai/chat/huyen-vu',
      platformName: 'Character.AI',
      creatorHandle: 'BacPhong',
    },
    6,
    'custom-1'
  );

  assert.equal(created.code, 'TV-07');
  assert.equal(created.name, 'Huyền Vũ');
  assert.equal(created.birthday, '15/10');
  assert.equal(created.age, '25 tuổi');
  assert.equal(created.zodiac, 'Thiên Yết');
  assert.equal(created.personality, 'Điềm tĩnh, thâm trầm, chiều chuộng');
  assert.equal(created.personalityNotes, 'Trọng chữ tín, luôn đứng đợi dưới hiên mưa.');
  assert.equal(created.creatorHandle, '@BacPhong');
  assert.deepEqual(created.tags, ['Kiếm đạo', 'Lạnh lùng', 'Tuyết sơn']);
  assert.equal(isValidHttpUrl(created.characterLink), true);
  assert.ok(countWords(created.openingMessage) >= 10);

  const md = formatCharacterExportMarkdown(created);
  assert.ok(md.includes('# Huyền Vũ'));
  assert.ok(md.includes('Ngày sinh: 15/10'));
  assert.ok(md.includes('Tuổi: 25 tuổi'));
  assert.ok(md.includes('Cung: Thiên Yết'));
  assert.ok(md.includes('Tính cách: Điềm tĩnh, thâm trầm, chiều chuộng'));
  assert.ok(md.includes('Creator: @BacPhong'));
  assert.ok(md.includes('https://character.ai/chat/huyen-vu'));

  const validation = validateCharacterForm({
    name: 'Huyền Vũ',
    tagsText: 'Kiếm đạo',
    backstoryText: 'Đoạn một của tiểu sử nhân vật đủ dài hơn hai mươi ký tự.',
    personalityNotes: '',
    openingMessage: '*Tuyết rơi phủ trắng mái đình cổ.*',
    characterLink: 'https://character.ai/chat/huyen-vu',
    platformName: 'Character.AI',
    creatorHandle: '@BacPhong',
  });
  assert.equal(validation.valid, true);
});

test('formatAudioTime and calculateAudioProgressPercent format full song progress accurately', () => {
  assert.equal(formatAudioTime(0), '00:00');
  assert.equal(formatAudioTime(169.24), '02:49');
  assert.equal(formatAudioTime(147.27), '02:27');
  assert.equal(formatAudioTime(-5), '00:00');
  assert.equal(formatAudioTime(Number.NaN), '00:00');

  assert.equal(calculateAudioProgressPercent(0, 169), 0);
  assert.equal(calculateAudioProgressPercent(84.5, 169), 50);
  assert.equal(calculateAudioProgressPercent(200, 169), 100);
  assert.equal(calculateAudioProgressPercent(10, 0), 0);
});

test('isCharacterNew (12h window), edit without NEW, and shortenLinkDisplay behave as expected', async () => {
  const {
    isCharacterNew,
    shortenLinkDisplay,
    buildCharacterFromInput,
    normalizeCharacterTimestamps,
  } = await import('./characterLogic.ts');
  const now = Date.now();
  const freshChar: CharacterProfile = {
    ...sampleCharacters[0],
    createdAt: now - 1000 * 60 * 60 * 11, // 11 hours ago (< 12h)
  };
  const thirteenHoursOldChar: CharacterProfile = {
    ...sampleCharacters[1],
    createdAt: now - 1000 * 60 * 60 * 13, // 13 hours ago (> 12h)
  };
  assert.equal(isCharacterNew(freshChar, now), true);
  assert.equal(isCharacterNew(thirteenHoursOldChar, now), false);

  // Updating an existing character's info must NOT set createdAt or mark it as NEW
  const updatedOldChar = buildCharacterFromInput(
    {
      name: 'Kaelen Vex (Cập nhật)',
      tagsText: 'Phá án, Noir',
      backstoryText: 'Tiểu sử nhân vật được cập nhật thêm chi tiết mới dài hơn hai mươi ký tự.',
      personalityNotes: 'Quan sát tỉ mỉ.',
      openingMessage: '"Cậu đến đúng giờ hơn hôm qua đấy," Kaelen khẽ gật đầu.',
      characterLink: 'https://janitorai.com/characters/kaelen-vex-noctis',
      platformName: 'JanitorAI',
      creatorHandle: '@NoctisChronicle',
    },
    1,
    thirteenHoursOldChar.id,
    thirteenHoursOldChar.createdAt,
    thirteenHoursOldChar
  );
  assert.equal(isCharacterNew(updatedOldChar, Date.now()), false);
  assert.equal(updatedOldChar.createdAt, thirteenHoursOldChar.createdAt);

  // Updating an existing character without createdAt must keep createdAt undefined (not NEW)
  const updatedNoCreatedAt = buildCharacterFromInput(
    {
      name: 'Linh Đan (Cập nhật)',
      tagsText: 'Chữa lành',
      backstoryText: 'Tiểu sử nhân vật được cập nhật thêm chi tiết mới dài hơn hai mươi ký tự.',
      personalityNotes: 'Ôn nhu.',
      openingMessage: '*Tiếng chuông gió bằng đồng khẽ ngân vang.*',
      characterLink: 'https://character.ai/chat/linh-dan-apothecary',
      platformName: 'Character.AI',
      creatorHandle: '@SonTraArchive',
    },
    0,
    sampleCharacters[0].id,
    sampleCharacters[0].createdAt,
    sampleCharacters[0]
  );
  assert.equal(updatedNoCreatedAt.createdAt, undefined);
  assert.equal(isCharacterNew(updatedNoCreatedAt, Date.now()), false);

  // Adding a brand-new character MUST mark it as NEW for 12 hours
  const newlyAddedChar = buildCharacterFromInput(
    {
      name: 'Nhân Vật Mới Tinh',
      tagsText: 'Mới',
      backstoryText: 'Tiểu sử nhân vật mới được thêm vào danh sách dài hơn hai mươi ký tự.',
      personalityNotes: 'Dịu dàng.',
      openingMessage: '*Xin chào, rất vui được gặp em hôm nay.*',
      characterLink: 'https://character.ai/chat/nhan-vat-moi',
      platformName: 'Character.AI',
      creatorHandle: '@Creator',
    },
    2
  );
  assert.equal(isCharacterNew(newlyAddedChar, Date.now()), true);
  assert.equal(isCharacterNew(newlyAddedChar, (newlyAddedChar.createdAt || Date.now()) + 12 * 60 * 60 * 1000), false);

  // Normalizing a custom character whose createdAt was previously overwritten restores original ID timestamp
  const healed = normalizeCharacterTimestamps({
    ...sampleCharacters[0],
    id: 'char-custom-1792437094681',
    createdAt: 1792574893862,
  });
  assert.equal(healed.createdAt, 1792437094681);
  assert.equal(healed.updatedAt, 1792574893862);

  const longLink = 'https://l.facebook.com/l.php?u=https%3A%2F%2Faistudio.google.com%2Fapp%2Fprompts%3Fstate%3Dtest123456789';
  const shortened = shortenLinkDisplay(longLink, 20, 15);
  assert.ok(shortened.includes('....'));
  assert.ok(shortened.startsWith('https://l.facebook.c'));
  assert.ok(shortened.endsWith('te%3Dtest123456789'.slice(-15)));

  const shortLink = 'https://example.com';
  assert.equal(shortenLinkDisplay(shortLink), 'https://example.com');
});

test('Multiverse INITIAL_SHOWS and INITIAL_OPEN_WORLDS are empty for user custom addition', async () => {
  const { INITIAL_SHOWS, INITIAL_OPEN_WORLDS } = await import('../data/multiverse.ts');
  assert.equal(INITIAL_SHOWS.length, 0, 'INITIAL_SHOWS must be empty as requested');
  assert.equal(INITIAL_OPEN_WORLDS.length, 0, 'INITIAL_OPEN_WORLDS must be empty as requested');
});

test('sortCharactersAlphabeticallyWithNewFirst sorts new members A-Z first then remaining members A-Z', async () => {
  const { sortCharactersAlphabeticallyWithNewFirst } = await import('./characterLogic.ts');
  const now = Date.now();
  const testList: CharacterProfile[] = [
    {
      ...sampleCharacters[0],
      id: 'char-c',
      name: 'Vũ Đức Cường',
      createdAt: now - 1000 * 60 * 60 * 50, // older
    },
    {
      ...sampleCharacters[0],
      id: 'char-a',
      name: 'An Nguyên',
      createdAt: now - 1000 * 60 * 60 * 50, // older
    },
    {
      ...sampleCharacters[0],
      id: 'char-new-b',
      name: 'Bảo Hoàng (Mới)',
      createdAt: now - 1000 * 60 * 60 * 2, // new (within 24h)
    },
    {
      ...sampleCharacters[0],
      id: 'char-new-a',
      name: 'Anh Dũng (Mới)',
      createdAt: now - 1000 * 60 * 60 * 1, // new (within 24h)
    },
  ];

  const sorted = sortCharactersAlphabeticallyWithNewFirst(testList, now);
  // New members should come first, sorted A-Z, with synchronized TV-01..TV-04 codes:
  assert.equal(sorted[0].name, 'Anh Dũng (Mới)');
  assert.equal(sorted[0].code, 'TV-01');
  assert.equal(sorted[1].name, 'Bảo Hoàng (Mới)');
  assert.equal(sorted[1].code, 'TV-02');
  // Older members come next, sorted A-Z:
  assert.equal(sorted[2].name, 'An Nguyên');
  assert.equal(sorted[2].code, 'TV-03');
  assert.equal(sorted[3].name, 'Vũ Đức Cường');
  assert.equal(sorted[3].code, 'TV-04');
});

test('appendSecretPasscodeKey detects the "choco" secret code and resets buffer', async () => {
  const { appendSecretPasscodeKey } = await import('./characterLogic.ts');
  let buf = '';
  for (const ch of ['x', 'y', 'C', 'h', 'O', 'c']) {
    const res = appendSecretPasscodeKey(buf, ch, 'choco');
    assert.equal(res.matched, false);
    buf = res.nextBuffer;
  }
  assert.equal(buf, 'ychoc');
  const finalRes = appendSecretPasscodeKey(buf, 'O', 'choco');
  assert.equal(finalRes.matched, true);
  assert.equal(finalRes.nextBuffer, '');
});

test('getNextTrackIndex advances through playlist and wraps around to first track', async () => {
  const { getNextTrackIndex } = await import('./characterLogic.ts');
  const tracks = [{ id: 't1' }, { id: 't2' }, { id: 't3' }];
  assert.equal(getNextTrackIndex(null, tracks), 0);
  assert.equal(getNextTrackIndex('t1', tracks), 1);
  assert.equal(getNextTrackIndex('t2', tracks), 2);
  assert.equal(getNextTrackIndex('t3', tracks), 0);
  assert.equal(getNextTrackIndex('unknown', tracks), 0);
  assert.equal(getNextTrackIndex('t1', []), -1);
});

test('daily house favorite expires at 24:00 (midnight) and requires new selection on a new day', async () => {
  const {
    getLocalDateKey,
    serializeHouseFavoriteForToday,
    resolveValidHouseFavoriteId,
    getMsUntilNextMidnight,
  } = await import('./characterLogic.ts');

  const day1BeforeMidnight = new Date(2026, 9, 20, 23, 59, 30); // Oct 20, 2026 23:59:30
  const day2AtMidnight = new Date(2026, 9, 21, 0, 0, 0); // Oct 21, 2026 00:00:00 (24:00 passed)

  assert.equal(getLocalDateKey(day1BeforeMidnight), '2026-10-20');
  assert.equal(getLocalDateKey(day2AtMidnight), '2026-10-21');

  const storedDay1 = serializeHouseFavoriteForToday('char-1', day1BeforeMidnight);
  assert.ok(storedDay1);

  // Before 24:00 on the same day, the favorite is valid
  assert.equal(resolveValidHouseFavoriteId(storedDay1, day1BeforeMidnight), 'char-1');

  // At or after 24:00 (next day 00:00), yesterday's favorite is no longer displayed
  assert.equal(resolveValidHouseFavoriteId(storedDay1, day2AtMidnight), null);

  // Legacy un-dated string or null should also resolve to null
  assert.equal(resolveValidHouseFavoriteId('char-1', day1BeforeMidnight), null);
  assert.equal(resolveValidHouseFavoriteId(null, day1BeforeMidnight), null);

  // Ms until next midnight from 23:59:30 is 30,000 ms
  assert.equal(getMsUntilNextMidnight(day1BeforeMidnight), 30000);
});

test('partitionTracksByVibe splits playlist into Light Vibe and Dark Vibe and respects overrides', async () => {
  const { partitionTracksByVibe } = await import('./characterLogic.ts');
  const samplePlaylist = [
    { id: 'congb-cho-chut', title: 'chờ chút...', artist: 'CONGB', type: 'light' as const },
    { id: 'izara-moianh', title: 'moianh', artist: 'IZARA', type: 'light' as const },
    { id: 'coolkid-sau-con-mua', title: 'Sau Cơn Mưa', artist: 'COOLKID, RHYDER', type: 'light' as const },
    { id: 'izara-wish-u-back', title: 'wish u back', artist: 'IZARA, Lil Liem', type: 'dark' as const },
    { id: 'kimlong-let-me-go', title: 'let me go', artist: 'KIMLONG', type: 'dark' as const },
    { id: 'haanhuy-nhuctiemthuc', title: 'Nhức Tiềm Thức', artist: 'Hà An Huy', type: 'dark' as const },
  ];

  const initialSplit = partitionTracksByVibe(samplePlaylist);
  assert.equal(initialSplit.lightTracks.length, 3);
  assert.equal(initialSplit.darkTracks.length, 3);
  assert.deepEqual(
    initialSplit.lightTracks.map((t) => t.title),
    ['chờ chút...', 'moianh', 'Sau Cơn Mưa']
  );
  assert.deepEqual(
    initialSplit.darkTracks.map((t) => t.title),
    ['wish u back', 'let me go', 'Nhức Tiềm Thức']
  );

  const overriddenSplit = partitionTracksByVibe(samplePlaylist, {
    'coolkid-sau-con-mua': 'dark',
  });
  assert.equal(overriddenSplit.lightTracks.length, 2);
  assert.equal(overriddenSplit.darkTracks.length, 4);
});

test('mergeAndSortCharacters applies custom edits and excludes deleted character IDs', async () => {
  const { mergeAndSortCharacters, buildCharacterFromInput } = await import('./characterLogic.ts');
  const now = Date.now();
  const editedC1 = buildCharacterFromInput(
    {
      name: 'Linh Đan (Đã sửa)',
      tagsText: 'Chữa lành, Mới sửa',
      backstoryText: 'Tiểu sử đã được người dùng cập nhật mới hoàn toàn.',
      personalityNotes: 'Ghi chú mới',
      openingMessage: '*Lời chào mở đầu mới được cập nhật.*',
      characterLink: 'https://character.ai/chat/linh-dan-updated',
      platformName: 'Character.AI',
      creatorHandle: '@SonTraArchive',
    },
    0,
    'c1',
    sampleCharacters[0].createdAt,
    sampleCharacters[0]
  );

  // Preserves shortHook from base character when shortHook input is omitted
  assert.equal(editedC1.shortHook, sampleCharacters[0].shortHook);

  const mergedAfterEdit = mergeAndSortCharacters(sampleCharacters, [editedC1], [], now);
  assert.equal(mergedAfterEdit.length, 2);
  assert.ok(mergedAfterEdit.some((c) => c.id === 'c1' && c.name === 'Linh Đan (Đã sửa)'));

  // Deleting an initial or edited character removes it from merged list
  const mergedAfterDelete = mergeAndSortCharacters(sampleCharacters, [editedC1], ['c1'], now);
  assert.equal(mergedAfterDelete.length, 1);
  assert.equal(mergedAfterDelete[0].id, 'c2');
});

test('formatLofiTime formats time with leading zeros and checks bedtime window correctly', async () => {
  const { formatLofiTime } = await import('./characterLogic.ts');

  // Morning 09:05 -> Not bedtime
  const morning = new Date(2026, 9, 20, 9, 5);
  const morningRes = formatLofiTime(morning);
  assert.equal(morningRes.displayHours, '09');
  assert.equal(morningRes.displayMinutes, '05');
  assert.equal(morningRes.timeString, '09:05');
  assert.equal(morningRes.isSleepTime, false);

  // Late night 23:45 -> Bedtime
  const lateNight = new Date(2026, 9, 20, 23, 45);
  const lateNightRes = formatLofiTime(lateNight);
  assert.equal(lateNightRes.timeString, '23:45');
  assert.equal(lateNightRes.isSleepTime, true);

  // Midnight 00:00 -> Bedtime
  const midnight = new Date(2026, 9, 21, 0, 0);
  const midnightRes = formatLofiTime(midnight);
  assert.equal(midnightRes.timeString, '00:00');
  assert.equal(midnightRes.isSleepTime, true);

  // Early morning 04:30 -> Bedtime
  const earlyMorning = new Date(2026, 9, 21, 4, 30);
  const earlyMorningRes = formatLofiTime(earlyMorning);
  assert.equal(earlyMorningRes.timeString, '04:30');
  assert.equal(earlyMorningRes.isSleepTime, true);

  // Dawn 05:00 -> Not bedtime
  const dawn = new Date(2026, 9, 21, 5, 0);
  const dawnRes = formatLofiTime(dawn);
  assert.equal(dawnRes.timeString, '05:00');
  assert.equal(dawnRes.isSleepTime, false);
});

test('isDiscordUrlExpired detects expired Discord CDN attachment URLs', async () => {
  const { isDiscordUrlExpired } = await import('./characterLogic.ts');

  // Expired discord URL from .data/choco-state.json: ex=6ad7b45a (timestamp 1792521306)
  const expiredUrl = 'https://media.discordapp.net/attachments/123/456/photo.png?ex=6ad7b45a&is=6ad662da';
  // If current timestamp is after expiry (1792600000 > 1792521306)
  assert.equal(isDiscordUrlExpired(expiredUrl, 1792600000 * 1000), true);
  // If current timestamp is before expiry (1792400000 < 1792521306)
  assert.equal(isDiscordUrlExpired(expiredUrl, 1792400000 * 1000), false);

  // Normal non-discord image URLs
  assert.equal(isDiscordUrlExpired('https://example.com/photo.jpg'), false);
  assert.equal(isDiscordUrlExpired(''), false);
});

test('filterDatingIdeas correctly filters by category and search query', async () => {
  const { filterDatingIdeas } = await import('./characterLogic.ts');

  const ideas = [
    { title: 'Làm bánh cookies', category: 'Tại gia', content: 'Nướng mẻ bánh quy thơm nức' },
    { title: 'Đi dạo ngắm hoàng hôn', category: 'Đi dạo', content: 'Rủ nhau ra bờ sông lúc chiều tà' },
    { title: 'Cắm trại ban công', category: 'Lãng mạn', content: 'Trải thảm ngắm sao đêm' },
  ];

  // Category "Tất cả" returns all
  assert.equal(filterDatingIdeas(ideas, 'Tất cả', '').length, 3);

  // Category specific filter
  const taiGia = filterDatingIdeas(ideas, 'Tại gia', '');
  assert.equal(taiGia.length, 1);
  assert.equal(taiGia[0].title, 'Làm bánh cookies');

  // Search query in title
  const searchBanh = filterDatingIdeas(ideas, 'Tất cả', 'bánh');
  assert.equal(searchBanh.length, 1);
  assert.equal(searchBanh[0].title, 'Làm bánh cookies');

  // Search query in content
  const searchChieuTa = filterDatingIdeas(ideas, 'Tất cả', 'chiều tà');
  assert.equal(searchChieuTa.length, 1);
  assert.equal(searchChieuTa[0].title, 'Đi dạo ngắm hoàng hôn');

  // Combined category + search query mismatch
  const noMatch = filterDatingIdeas(ideas, 'Đi dạo', 'cookies');
  assert.equal(noMatch.length, 0);
});

test('validateMemoryInput, createMemoryEntry, and deleteMemoryEntry manage diary entries properly', async () => {
  const { validateMemoryInput, createMemoryEntry, deleteMemoryEntry } = await import(
    './characterLogic.ts'
  );

  // Validation
  assert.equal(validateMemoryInput('', '').valid, false);
  assert.equal(validateMemoryInput('Seonghyeon', '').valid, false);
  assert.equal(validateMemoryInput('', 'Yêu em').valid, false);
  assert.equal(validateMemoryInput('Seonghyeon', 'Yêu em').valid, true);

  // Creation
  const entry = createMemoryEntry('Seonghyeon', 'Cậu là điều tuyệt vời nhất', 'Ấm lòng quá', '21/10/2026, 12:00:00');
  assert.equal(entry.character, 'Seonghyeon');
  assert.equal(entry.quote, 'Cậu là điều tuyệt vời nhất');
  assert.equal(entry.thought, 'Ấm lòng quá');
  assert.equal(entry.date, '21/10/2026, 12:00:00');

  // Deletion
  const list = [entry, { ...entry, character: 'Minh Quân' }];
  const deleted = deleteMemoryEntry(list, 0);
  assert.equal(deleted.length, 1);
  assert.equal(deleted[0].character, 'Minh Quân');
});

test('minigame helpers evaluateRiddleAnswer, createMemoryDeck, createMemoryDeckForLevel, and isStarJarComplete work accurately', async () => {
  const {
    DANH_SACH_MAT_NGU,
    DANH_SACH_THU_TAY,
    KHO_BIEU_TUONG,
    evaluateRiddleAnswer,
    createMemoryDeck,
    createMemoryDeckForLevel,
    getPairCountForLevel,
    isStarJarComplete,
    DEFAULT_MEMORY_SYMBOLS,
  } = await import('./characterLogic.ts');

  // Verify 10 riddles and 3 letters exist
  assert.equal(DANH_SACH_MAT_NGU.length, 10);
  assert.equal(DANH_SACH_THU_TAY.length, 3);
  assert.equal(KHO_BIEU_TUONG.length, 12);

  // Verify each of the 10 riddles accepts its primary and accentless answers
  for (const item of DANH_SACH_MAT_NGU) {
    for (const ans of item.dapAn) {
      const res = evaluateRiddleAnswer(`  ${ans.toUpperCase()} `, item);
      assert.equal(res.isCorrect, true, `Expected "${ans}" to solve riddle: ${item.cauDo}`);
    }
    const wrongRes = evaluateRiddleAnswer('sai_dap_an', item);
    assert.equal(wrongRes.isCorrect, false);
    assert.equal(
      wrongRes.message,
      'Chưa đúng rồi, hãy nhắm mắt tĩnh tâm lại một chút xem...'
    );
    assert.equal(wrongRes.color, '#a8948a');
  }

  // Default riddle check ("Sầu" / "sau")
  const correct1 = evaluateRiddleAnswer('Sầu');
  assert.equal(correct1.isCorrect, true);
  assert.equal(correct1.color, '#ffb6b9');

  // Memory deck creation (4 symbols -> 8 cards, 2 of each)
  const deck = createMemoryDeck(DEFAULT_MEMORY_SYMBOLS, () => 0.3);
  assert.equal(deck.length, 8);
  for (const sym of DEFAULT_MEMORY_SYMBOLS) {
    assert.equal(deck.filter((s) => s === sym).length, 2);
  }

  // Level-based pair counts and decks: easy (4 pairs / 8 cards), medium (8 pairs / 16 cards), hard (12 pairs / 24 cards)
  assert.equal(getPairCountForLevel('easy'), 4);
  assert.equal(getPairCountForLevel('medium'), 8);
  assert.equal(getPairCountForLevel('hard'), 12);

  const easyDeck = createMemoryDeckForLevel('easy', () => 0.4);
  const mediumDeck = createMemoryDeckForLevel('medium', () => 0.4);
  const hardDeck = createMemoryDeckForLevel('hard', () => 0.4);
  assert.equal(easyDeck.length, 8);
  assert.equal(mediumDeck.length, 16);
  assert.equal(hardDeck.length, 24);

  // Star Jar target check (15 stars)
  assert.equal(isStarJarComplete(0), false);
  assert.equal(isStarJarComplete(14), false);
  assert.equal(isStarJarComplete(15), true);
  assert.equal(isStarJarComplete(16), true);

  // Sky Polaroid collection across different times of day
  const { DANH_SACH_ANH_BAU_TROI, pickRandomSkyPolaroid } = await import(
    './characterLogic.ts'
  );
  assert.equal(DANH_SACH_ANH_BAU_TROI.length, 6);
  const firstSky = pickRandomSkyPolaroid(null, () => 0);
  assert.equal(firstSky.id, 'dawn');
  const nextSky = pickRandomSkyPolaroid('dawn', () => 0);
  assert.notEqual(nextSky.id, 'dawn');
});

test('catVaoKho, layTuKho, buildKyUcBackupPayload, and parseKyUcRestorePayload work accurately', async () => {
  const {
    catVaoKho,
    layTuKho,
    buildKyUcBackupPayload,
    parseKyUcRestorePayload,
  } = await import('./characterLogic.ts');

  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };

  // Empty key returns []
  assert.deepEqual(layTuKho('chocoMemories', mockStorage), []);
  assert.deepEqual(layTuKho('diemGomSao', mockStorage), []);

  // Storing and retrieving
  const sampleMemories = [
    {
      date: '21/10/2026',
      character: 'Lục Thừa Dã',
      quote: 'Trời mưa rồi, về nhà thôi.',
      thought: 'Ấm áp quá',
    },
  ];
  catVaoKho('chocoMemories', sampleMemories, mockStorage);
  catVaoKho('diemGomSao', 15, mockStorage);

  assert.deepEqual(layTuKho('chocoMemories', mockStorage), sampleMemories);
  assert.equal(layTuKho('diemGomSao', mockStorage), 15);

  const backup = buildKyUcBackupPayload(mockStorage);
  assert.deepEqual(backup, {
    kyUc: sampleMemories,
    diemSao: 15,
  });

  // Restore valid payload
  const parsedValid = parseKyUcRestorePayload(JSON.stringify(backup));
  assert.equal(parsedValid.valid, true);
  assert.deepEqual(parsedValid.kyUc, sampleMemories);
  assert.equal(parsedValid.diemSao, 15);

  // Restore invalid payload
  const parsedInvalidJson = parseKyUcRestorePayload('not-a-json');
  assert.equal(parsedInvalidJson.valid, false);
  assert.equal(
    parsedInvalidJson.error,
    'Hình như đây không phải là chiếc hộp ký ức của Choco...'
  );

  const parsedMissingKeys = parseKyUcRestorePayload(JSON.stringify({ hello: 'world' }));
  assert.equal(parsedMissingKeys.valid, false);
});



