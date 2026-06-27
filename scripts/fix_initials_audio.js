#!/usr/bin/env node
/**
 * 修正特定聲母的單音發音
 *
 * 問題：
 *   - ㄅㄆㄇㄈ 被 Google TTS 讀成 bo/po/mo/fo（注音符號名稱）
 *     → 應改為 ㄅㄜ/ㄆㄜ/ㄇㄜ/ㄈㄜ（短促清音）
 *   - ㄓㄔㄕㄖㄗㄘㄙ 尾音帶「一」
 *     → 改為對應漢字：知/吃/師/而/資/疵/司
 *
 * 使用方式：node scripts/fix_initials_audio.js
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

// ── 修正對照表 ────────────────────────────────────────────────────────────────
// key: 注音符號  value: 送給 Google TTS 的文字（決定最終發音）
const FIX_MAP = {
  // ㄅㄆㄇㄈ → 改用 ㄅㄜ/ㄆㄜ/ㄇㄜ/ㄈㄜ（短促ㄜ音，不帶韻名）
  'ㄅ': 'ㄅㄜ',
  'ㄆ': 'ㄆㄜ',
  'ㄇ': 'ㄇㄜ',
  'ㄈ': 'ㄈㄜ',
  // ㄓㄔㄕㄖㄗㄘㄙ → 改用漢字錨點，發音乾淨標準
  'ㄓ': '知',   // zhī
  'ㄔ': '吃',   // chī
  'ㄕ': '師',   // shī
  'ㄖ': '而',   // ér（以ㄖ開頭的自然發音）
  'ㄗ': '資',   // zī
  'ㄘ': '疵',   // cī
  'ㄙ': '司',   // sī
};

// ── 工具：注音符號 → 音檔名 ──────────────────────────────────────────────────
function toFileName(syllable) {
  const hexParts = [...syllable].map(c =>
    c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')
  );
  return hexParts.join('_') + '.mp3';
}

// ── 工具：下載 Google Translate TTS 音檔 ────────────────────────────────────
function downloadTTS(text, outPath) {
  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(text);
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
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(outPath);
        const protocol = res.headers.location.startsWith('https') ? https : http;
        protocol.get(res.headers.location, options, (res2) => {
          res2.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', err => { fs.unlink(outPath, () => {}); reject(err); });
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(outPath, () => {});
        reject(new Error(`HTTP ${res.statusCode} for: ${text}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });

    request.on('error', err => { fs.unlink(outPath, () => {}); reject(err); });
    request.setTimeout(10000, () => {
      request.abort();
      fs.unlink(outPath, () => {});
      reject(new Error(`Timeout: ${text}`));
    });
  });
}

// ── 主程式 ────────────────────────────────────────────────────────────────────
async function main() {
  const audioDir  = path.join(__dirname, '..', 'audio');
  const manifestPath = path.join(audioDir, 'manifest.json');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  const entries = Object.entries(FIX_MAP);
  console.log(`\n🔧 共需修正 ${entries.length} 個聲母音檔\n`);

  for (const [symbol, textToSpeak] of entries) {
    const filename = toFileName(symbol);
    const outPath  = path.join(audioDir, filename);

    // 刪除舊音檔
    if (fs.existsSync(outPath)) {
      fs.unlinkSync(outPath);
      console.log(`  🗑️  刪除舊檔：${filename}`);
    }

    // 下載新音檔
    try {
      process.stdout.write(`  ⬇️  ${symbol} (送出文字「${textToSpeak}」) → ${filename} ... `);
      await downloadTTS(textToSpeak, outPath);
      console.log('✓');

      // 更新 manifest 的 key（文字來源），路徑不變
      manifest[symbol] = `audio/${filename}`;

      // 稍作間隔避免被限流
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.log(`✗ (${err.message})`);
    }
  }

  // 寫回 manifest.json
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log('\n✅ manifest.json 已更新\n');
  console.log('🎉 完成！請重新載入頁面並測試各聲母發音。');
}

main().catch(console.error);
