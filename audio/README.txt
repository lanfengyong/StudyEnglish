人教PEP三年级上册 - 音频文件放置说明
=====================================

请将人教社官网或教材配套资源下载的 MP3 音频，按以下目录结构放入本文件夹：

audio/
├── unit1/
│   ├── u1-partA-talk.mp3          ← Unit1 Part A 课文对话
│   ├── u1-partB-talk.mp3          ← Unit1 Part B 课文对话
│   └── words/
│       ├── friend.mp3             ← 单词发音（文件名与英文单词一致）
│       ├── hand.mp3
│       └── ...
├── unit2/
│   ├── u2-partA-talk.mp3
│   ├── u2-partB-talk.mp3
│   └── words/
│       └── ...
├── unit3/ ... unit4/ ... unit5/ ... unit6/ （结构相同）

【课文音频文件名对照】
  unit1: u1-partA-talk.mp3, u1-partB-talk.mp3
  unit2: u2-partA-talk.mp3, u2-partB-talk.mp3
  unit3: u3-partA-talk.mp3, u3-partB-talk.mp3
  unit4: u4-partA-talk.mp3, u4-partB-talk.mp3
  unit5: u5-partA-talk.mp3, u5-partB-talk.mp3
  unit6: u6-partA-talk.mp3, u6-partB-talk.mp3

【单词音频】
  放在各单元 words/ 子目录下，文件名 = 英文单词.mp3（全小写）
  例如：friend.mp3, big.mp3, elephant.mp3

【自定义路径】
  如需修改音频路径，请编辑 js/data.js 中各课的 audio 字段及单词 audio 生成逻辑。

【无音频时】
  程序会自动使用浏览器内置英文朗读（Web Speech API）作为备用。

【音频来源建议】
  - 人教社电子教材配套音频
  - 教材光盘 / 点读资源
  - 学校下发的官方配套 MP3

注意：请使用正版教材配套音频，尊重版权。
