#!/usr/bin/env node
/**
 * 音檔批量下載腳本 (Google Translate TTS)
 * 
 * 為所有注音符號、兩拼、三拼組合預先生成高品質 MP3 音檔
 * 使用 Google Translate TTS (免費, 台灣口音, zh-TW)
 * 
 * 使用方式：node scripts/generate_audio.js
 * 
 * 輸出目錄：audio/
 * 命名規則：將注音符號的 Unicode 碼點轉成 hex 串，例如：
 *   ㄅ -> 3105 -> "3105.mp3"
 *   ㄅㄚ一聲 -> "3105_311A_tone1.mp3"
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ── 注音資料 ──────────────────────────────────────────────────────────────────

const INITIALS = ['ㄅ','ㄆ','ㄇ','ㄈ','ㄉ','ㄊ','ㄋ','ㄌ','ㄍ','ㄎ','ㄏ','ㄐ','ㄑ','ㄒ','ㄓ','ㄔ','ㄕ','ㄖ','ㄗ','ㄘ','ㄙ'];
const MEDIALS = ['ㄧ','ㄨ','ㄩ'];
const FINALS  = ['ㄚ','ㄛ','ㄜ','ㄝ','ㄞ','ㄟ','ㄠ','ㄡ','ㄢ','ㄣ','ㄤ','ㄥ','ㄦ'];
const ALL_SYMBOLS = [...INITIALS, ...MEDIALS, ...FINALS];

// 聲調符號（一聲沒有符號）
const TONES = [
  { mark: '',  name: 'tone1' },
  { mark: 'ˊ', name: 'tone2' },
  { mark: 'ˇ', name: 'tone3' },
  { mark: 'ˋ', name: 'tone4' },
  { mark: '˙', name: 'tone5' },
];

// 兩拼
const TWO_PINYIN_LIST = [
  'ㄅㄧ','ㄆㄧ','ㄇㄧ','ㄉㄧ','ㄊㄧ','ㄋㄧ','ㄌㄧ',
  'ㄅㄨ','ㄆㄨ','ㄇㄨ','ㄈㄨ','ㄉㄨ','ㄊㄨ','ㄋㄨ','ㄌㄨ','ㄍㄨ','ㄎㄨ','ㄏㄨ','ㄓㄨ','ㄔㄨ','ㄕㄨ','ㄖㄨ','ㄗㄨ','ㄘㄨ','ㄙㄨ',
  'ㄋㄩ','ㄌㄩ','ㄐㄩ','ㄑㄩ','ㄒㄩ',
  'ㄅㄚ','ㄅㄛ','ㄅㄞ','ㄅㄟ','ㄅㄠ','ㄅㄢ','ㄅㄣ','ㄅㄤ','ㄅㄥ',
  'ㄆㄚ','ㄆㄛ','ㄆㄞ','ㄆㄟ','ㄆㄠ','ㄆㄡ','ㄆㄢ','ㄆㄣ','ㄆㄤ','ㄆㄥ',
  'ㄇㄚ','ㄇㄛ','ㄇㄜ','ㄇㄞ','ㄇㄟ','ㄇㄠ','ㄇㄡ','ㄇㄢ','ㄇㄣ','ㄇㄤ','ㄇㄥ',
  'ㄈㄚ','ㄈㄛ','ㄈㄟ','ㄈㄡ','ㄈㄢ','ㄈㄣ','ㄈㄤ','ㄈㄥ',
  'ㄉㄚ','ㄉㄜ','ㄉㄞ','ㄉㄟ','ㄉㄠ','ㄉㄡ','ㄉㄢ','ㄉㄣ','ㄉㄤ','ㄉㄥ',
  'ㄊㄚ','ㄊㄜ','ㄊㄞ','ㄊㄠ','ㄊㄡ','ㄊㄢ','ㄊㄣ','ㄊㄤ','ㄊㄥ',
  'ㄋㄚ','ㄋㄜ','ㄋㄞ','ㄋㄟ','ㄋㄠ','ㄋㄡ','ㄋㄢ','ㄋㄣ','ㄋㄤ','ㄋㄥ',
  'ㄌㄚ','ㄌㄛ','ㄌㄜ','ㄌㄞ','ㄌㄟ','ㄌㄠ','ㄌㄡ','ㄌㄢ','ㄌㄣ','ㄌㄤ','ㄌㄥ',
  'ㄍㄚ','ㄍㄜ','ㄍㄞ','ㄍㄟ','ㄍㄠ','ㄍㄡ','ㄍㄢ','ㄍㄣ','ㄍㄤ','ㄍㄥ',
  'ㄎㄚ','ㄎㄜ','ㄎㄞ','ㄎㄟ','ㄎㄠ','ㄎㄡ','ㄎㄢ','ㄎㄣ','ㄎㄤ','ㄎㄥ',
  'ㄏㄚ','ㄏㄜ','ㄏㄞ','ㄏㄟ','ㄏㄠ','ㄏㄡ','ㄏㄢ','ㄏㄣ','ㄏㄤ','ㄏㄥ',
  'ㄓㄚ','ㄓㄜ','ㄓㄞ','ㄓㄟ','ㄓㄠ','ㄓㄡ','ㄓㄢ','ㄓㄣ','ㄓㄤ','ㄓㄥ',
  'ㄔㄚ','ㄔㄜ','ㄔㄞ','ㄔㄠ','ㄔㄡ','ㄔㄢ','ㄔㄣ','ㄔㄤ','ㄔㄥ',
  'ㄕㄚ','ㄕㄜ','ㄕㄞ','ㄕㄟ','ㄕㄠ','ㄕㄡ','ㄕㄢ','ㄕㄣ','ㄕㄤ','ㄕㄥ',
  'ㄖㄜ','ㄖㄠ','ㄖㄡ','ㄖㄢ','ㄖㄣ','ㄖㄤ','ㄖㄥ',
  'ㄗㄚ','ㄗㄜ','ㄗㄞ','ㄗㄟ','ㄗㄠ','ㄗㄡ','ㄗㄢ','ㄗㄣ','ㄗㄤ','ㄗㄥ',
  'ㄘㄚ','ㄘㄜ','ㄘㄞ','ㄘㄠ','ㄘㄡ','ㄘㄢ','ㄘㄣ','ㄘㄤ','ㄘㄥ',
  'ㄙㄚ','ㄙㄜ','ㄙㄞ','ㄙㄠ','ㄙㄡ','ㄙㄢ','ㄙㄣ','ㄙㄤ','ㄙㄥ',
  'ㄧㄚ','ㄧㄛ','ㄧㄝ','ㄧㄠ','ㄧㄡ','ㄧㄢ','ㄧㄣ','ㄧㄤ','ㄧㄥ',
  'ㄨㄚ','ㄨㄛ','ㄨㄞ','ㄨㄟ','ㄨㄢ','ㄨㄣ','ㄨㄤ','ㄨㄥ',
  'ㄩㄝ','ㄩㄢ','ㄩㄣ','ㄩㄥ',
];

// 三拼
const THREE_PINYIN_LIST = [
  'ㄅㄧㄚ','ㄅㄧㄠ','ㄅㄧㄢ','ㄅㄧㄣ','ㄅㄧㄥ',
  'ㄆㄧㄠ','ㄆㄧㄢ','ㄆㄧㄣ','ㄆㄧㄥ',
  'ㄇㄧㄠ','ㄇㄧㄢ','ㄇㄧㄣ','ㄇㄧㄥ',
  'ㄉㄧㄠ','ㄉㄧㄢ','ㄉㄧㄥ',
  'ㄊㄧㄠ','ㄊㄧㄢ','ㄊㄧㄥ',
  'ㄋㄧㄚ','ㄋㄧㄠ','ㄋㄧㄢ','ㄋㄧㄣ','ㄋㄧㄥ',
  'ㄌㄧㄚ','ㄌㄧㄠ','ㄌㄧㄢ','ㄌㄧㄣ','ㄌㄧㄥ',
  'ㄐㄧㄚ','ㄐㄧㄝ','ㄐㄧㄠ','ㄐㄧㄡ','ㄐㄧㄢ','ㄐㄧㄣ','ㄐㄧㄤ','ㄐㄧㄥ',
  'ㄑㄧㄚ','ㄑㄧㄝ','ㄑㄧㄠ','ㄑㄧㄡ','ㄑㄧㄢ','ㄑㄧㄣ','ㄑㄧㄤ','ㄑㄧㄥ',
  'ㄒㄧㄚ','ㄒㄧㄝ','ㄒㄧㄠ','ㄒㄧㄡ','ㄒㄧㄢ','ㄒㄧㄣ','ㄒㄧㄤ','ㄒㄧㄥ',
  'ㄉㄨㄛ','ㄉㄨㄟ','ㄉㄨㄢ','ㄉㄨㄣ','ㄉㄨㄥ',
  'ㄊㄨㄛ','ㄊㄨㄢ','ㄊㄨㄣ','ㄊㄨㄥ',
  'ㄋㄨㄛ','ㄋㄨㄢ','ㄋㄨㄥ',
  'ㄌㄨㄛ','ㄌㄨㄢ','ㄌㄨㄣ','ㄌㄨㄥ',
  'ㄍㄨㄚ','ㄍㄨㄛ','ㄍㄨㄞ','ㄍㄨㄟ','ㄍㄨㄢ','ㄍㄨㄣ','ㄍㄨㄥ',
  'ㄎㄨㄚ','ㄎㄨㄛ','ㄎㄨㄞ','ㄎㄨㄟ','ㄎㄨㄢ','ㄎㄨㄣ','ㄎㄨㄥ',
  'ㄏㄨㄚ','ㄏㄨㄛ','ㄏㄨㄞ','ㄏㄨㄟ','ㄏㄨㄢ','ㄏㄨㄣ','ㄏㄨㄥ',
  'ㄓㄨㄚ','ㄓㄨㄛ','ㄓㄨㄞ','ㄓㄨㄟ','ㄓㄨㄢ','ㄓㄨㄣ','ㄓㄨㄥ',
  'ㄔㄨㄚ','ㄔㄨㄛ','ㄔㄨㄞ','ㄔㄨㄟ','ㄔㄨㄢ','ㄔㄨㄣ','ㄔㄨㄥ',
  'ㄕㄨㄚ','ㄕㄨㄛ','ㄕㄨㄞ','ㄕㄨㄟ','ㄕㄨㄢ','ㄕㄨㄣ','ㄕㄨㄥ',
  'ㄖㄨㄛ','ㄖㄨㄟ','ㄖㄨㄢ','ㄖㄨㄣ','ㄖㄨㄥ',
  'ㄗㄨㄛ','ㄗㄨㄟ','ㄗㄨㄢ','ㄗㄨㄣ','ㄗㄨㄥ',
  'ㄘㄨㄛ','ㄘㄨㄟ','ㄘㄨㄢ','ㄘㄨㄣ','ㄘㄨㄥ',
  'ㄙㄨㄛ','ㄙㄨㄟ','ㄙㄨㄢ','ㄙㄨㄣ','ㄙㄨㄥ',
  'ㄋㄩㄝ','ㄌㄩㄝ',
  'ㄐㄩㄝ','ㄐㄩㄢ','ㄐㄩㄣ','ㄐㄩㄥ',
  'ㄑㄩㄝ','ㄑㄩㄢ','ㄑㄩㄣ','ㄑㄩㄥ',
  'ㄒㄩㄝ','ㄒㄩㄢ','ㄒㄩㄣ','ㄒㄩㄥ',
];

// ── 工具函式 ──────────────────────────────────────────────────────────────────

/**
 * 將注音字串轉成安全的檔名 (使用 Unicode 碼點 hex)
 * 例如："ㄅ" => "3105"，"ㄅㄚ" => "3105_311A"
 */
function toFileName(syllable, toneName) {
  const hexParts = [...syllable].map(c =>
    c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')
  );
  const base = hexParts.join('_');
  return toneName ? `${base}_${toneName}.mp3` : `${base}.mp3`;
}

/**
 * 下載一個 Google Translate TTS 的音檔
 * @param {string} text - 要朗讀的文字
 * @param {string} outPath - 輸出檔案路徑
 */
function downloadTTS(text, outPath) {
  return new Promise((resolve, reject) => {
    // 若檔案已存在，跳過
    if (fs.existsSync(outPath)) {
      process.stdout.write('.');
      return resolve();
    }

    const encodedText = encodeURIComponent(text);
    // Google Translate TTS API (非官方，免費)
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-TW&client=tw-ob&q=${encodedText}&ttsspeed=0.7`;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
        'Accept': 'audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,*/*;q=0.8',
      }
    };

    const file = fs.createWriteStream(outPath);
    
    const request = https.get(url, options, (res) => {
      // 處理 301/302 redirect
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(outPath);
        const redirectUrl = res.headers.location;
        const protocol = redirectUrl.startsWith('https') ? https : http;
        protocol.get(redirectUrl, options, (res2) => {
          res2.pipe(file);
          file.on('finish', () => {
            file.close();
            process.stdout.write('✓');
            resolve();
          });
        }).on('error', (err) => {
          fs.unlink(outPath, () => {});
          reject(err);
        });
        return;
      }
      
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(outPath, () => {});
        reject(new Error(`HTTP ${res.statusCode} for: ${text}`));
        return;
      }
      
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        process.stdout.write('✓');
        resolve();
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(outPath, () => {});
      reject(err);
    });
    
    // 10 秒超時
    request.setTimeout(10000, () => {
      request.abort();
      fs.unlink(outPath, () => {});
      reject(new Error(`Timeout: ${text}`));
    });
  });
}

/**
 * 限速下載（避免被限流）
 * @param {Array} tasks - [{text, outPath}]
 * @param {number} concurrency - 同時下載數量
 * @param {number} delayMs - 每個任務間的延遲 ms
 */
async function downloadWithRateLimit(tasks, concurrency = 2, delayMs = 300) {
  let idx = 0;
  let errors = [];
  
  async function worker() {
    while (idx < tasks.length) {
      const task = tasks[idx++];
      try {
        await downloadTTS(task.text, task.outPath);
        await new Promise(r => setTimeout(r, delayMs));
      } catch (err) {
        errors.push({ text: task.text, err: err.message });
        process.stdout.write('✗');
      }
    }
  }
  
  const workers = Array(concurrency).fill(null).map(() => worker());
  await Promise.all(workers);
  return errors;
}

// ── 主程式 ────────────────────────────────────────────────────────────────────

async function main() {
  const audioDir = path.join(__dirname, '..', 'audio');
  
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  
  const tasks = [];
  
  // 1. 37 個基本符號 (Level 1) — 一聲
  console.log('\n📦 準備任務：37 個基本符號...');
  for (const sym of ALL_SYMBOLS) {
    const outPath = path.join(audioDir, toFileName(sym, null));
    // 對於基本符號，直接用符號本身讓 Google TTS 讀（它知道如何讀注音）
    tasks.push({ text: sym, outPath });
  }
  
  // 2. 兩拼 × 5 聲調
  console.log('📦 準備任務：兩拼組合 × 5 聲調...');
  for (const syllable of TWO_PINYIN_LIST) {
    for (const tone of TONES) {
      const textToSpeak = syllable + tone.mark;
      const outPath = path.join(audioDir, toFileName(syllable, tone.name));
      tasks.push({ text: textToSpeak, outPath });
    }
  }
  
  // 3. 三拼 × 5 聲調
  console.log('📦 準備任務：三拼組合 × 5 聲調...');
  for (const syllable of THREE_PINYIN_LIST) {
    for (const tone of TONES) {
      const textToSpeak = syllable + tone.mark;
      const outPath = path.join(audioDir, toFileName(syllable, tone.name));
      tasks.push({ text: textToSpeak, outPath });
    }
  }
  
  const total = tasks.length;
  const existingCount = tasks.filter(t => fs.existsSync(t.outPath)).length;
  const toDownload = total - existingCount;
  
  console.log(`\n📊 統計：共 ${total} 個音檔，已有 ${existingCount} 個，需下載 ${toDownload} 個`);
  
  if (toDownload === 0) {
    console.log('✅ 所有音檔已是最新！無需下載。');
    generateManifest(audioDir, tasks);
    return;
  }
  
  console.log(`\n🚀 開始下載（2 個並發，每次 300ms 延遲）...\n`);
  
  const errors = await downloadWithRateLimit(tasks, 2, 300);
  
  console.log(`\n\n📊 下載完成！`);
  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} 個失敗：`);
    errors.forEach(e => console.log(`  ✗ "${e.text}": ${e.err}`));
  } else {
    console.log('✅ 全部成功！');
  }
  
  // 生成 manifest.json
  generateManifest(audioDir, tasks);
}

/**
 * 生成 audio/manifest.json 供前端使用 (知道哪些音檔存在)
 */
function generateManifest(audioDir, tasks) {
  console.log('\n📝 生成 audio/manifest.json...');
  
  const manifest = {};
  for (const task of tasks) {
    if (fs.existsSync(task.outPath)) {
      const fileName = path.basename(task.outPath);
      manifest[task.text] = `audio/${fileName}`;
    }
  }
  
  const manifestPath = path.join(audioDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ manifest.json 寫入完成 (${Object.keys(manifest).length} 個條目)`);
}

main().catch(console.error);
