/**
 * 人教版 PEP 英语三年级上册（2024 新版）数据源
 * 音频路径为占位符，请将官网下载的 mp3 放入 audio/ 对应目录后自行替换
 */
const PEP_GRADE3_BOOK = {
  title: '人教PEP三年级上册',
  edition: '2024新版',
  units: [
    {
      id: 'unit1',
      number: 1,
      title: 'Making friends',
      titleCn: '交朋友',
      words: [
        { en: 'and', cn: '和；与', phonetic: '/ænd/' },
        { en: 'arm', cn: '胳膊', phonetic: '/ɑːm/' },
        { en: 'can', cn: '可以', phonetic: '/kæn/' },
        { en: 'ear', cn: '耳朵', phonetic: '/ɪə(r)/' },
        { en: 'eye', cn: '眼睛', phonetic: '/aɪ/' },
        { en: 'friend', cn: '朋友', phonetic: '/frend/' },
        { en: 'good', cn: '好的', phonetic: '/ɡʊd/' },
        { en: 'goodbye', cn: '再见', phonetic: '/ˌɡʊdˈbaɪ/' },
        { en: 'hand', cn: '手', phonetic: '/hænd/' },
        { en: 'help', cn: '帮助', phonetic: '/help/' },
        { en: 'listen', cn: '听；倾听', phonetic: '/ˈlɪsn/' },
        { en: 'mouth', cn: '嘴', phonetic: '/maʊθ/' },
        { en: 'nice', cn: '令人愉快的；友好的', phonetic: '/naɪs/' },
        { en: 'say', cn: '说；讲', phonetic: '/seɪ/' },
        { en: 'share', cn: '分享', phonetic: '/ʃeə(r)/' },
        { en: 'smile', cn: '微笑；笑', phonetic: '/smaɪl/' },
        { en: 'toy', cn: '玩具', phonetic: '/tɔɪ/' }
      ],
      lessons: [
        {
          id: 'u1-partA-talk',
          title: "Part A Let's talk",
          titleCn: '问候与自我介绍',
          lines: [
            { en: "Hello! I'm Mike Black.", cn: '你好！我是迈克·布莱克。' },
            { en: 'Hi! My name is Wu Binbin.', cn: '嗨！我叫吴斌斌。' },
            { en: 'Nice to meet you.', cn: '见到你很高兴。' },
            { en: 'Nice to meet you too.', cn: '见到你（我）也很高兴。' }
          ],
          audio: 'audio/unit1/u1-partA-talk.mp3'
        },
        {
          id: 'u1-partB-talk',
          title: "Part B Let's talk",
          titleCn: '怎样成为好朋友',
          lines: [
            { en: 'Am I a good friend?', cn: '我是一个好朋友吗？' },
            { en: 'Yes, I am!', cn: '是的，我是！' },
            { en: 'I listen with care.', cn: '我认真倾听。' },
            { en: 'I share my toys.', cn: '我分享我的玩具。' },
            { en: 'I help my friends.', cn: '我帮助我的朋友。' },
            { en: 'I am a good friend!', cn: '我是一个好朋友！' }
          ],
          audio: 'audio/unit1/u1-partB-talk.mp3'
        }
      ]
    },
    {
      id: 'unit2',
      number: 2,
      title: 'Different families',
      titleCn: '不同的家庭',
      words: [
        { en: 'aunt', cn: '姑母；姨母；伯母；婶母；舅母', phonetic: '/ɑːnt/' },
        { en: 'baby', cn: '婴儿', phonetic: '/ˈbeɪbi/' },
        { en: 'big', cn: '大的', phonetic: '/bɪɡ/' },
        { en: 'brother', cn: '兄弟', phonetic: '/ˈbrʌðə(r)/' },
        { en: 'cousin', cn: '堂（表）兄弟；堂（表）姐妹', phonetic: '/ˈkʌzn/' },
        { en: 'dad', cn: '（口语）爸爸', phonetic: '/dæd/' },
        { en: 'family', cn: '家；家庭', phonetic: '/ˈfæməli/' },
        { en: 'father', cn: '父亲；爸爸', phonetic: '/ˈfɑːðə(r)/' },
        { en: 'grandfather', cn: '（外）祖父；爷爷；姥爷；外公', phonetic: '/ˈɡrænfɑːðə(r)/' },
        { en: 'grandma', cn: '（口语）（外）祖母', phonetic: '/ˈɡrænmɑː/' },
        { en: 'grandmother', cn: '（外）祖母；奶奶；姥姥；外婆', phonetic: '/ˈɡrænmʌðə(r)/' },
        { en: 'grandpa', cn: '（口语）（外）祖父', phonetic: '/ˈɡrænpɑː/' },
        { en: 'have', cn: '有', phonetic: '/hæv/' },
        { en: 'me', cn: '我', phonetic: '/miː/' },
        { en: 'mother', cn: '母亲；妈妈', phonetic: '/ˈmʌðə(r)/' },
        { en: 'mum', cn: '（口语）妈妈', phonetic: '/mʌm/' },
        { en: 'sister', cn: '姐；妹', phonetic: '/ˈsɪstə(r)/' },
        { en: 'small', cn: '小的', phonetic: '/smɔːl/' },
        { en: 'some', cn: '一些', phonetic: '/sʌm/' },
        { en: 'uncle', cn: '舅父；叔父；伯父；姑父；姨父', phonetic: '/ˈʌŋkl/' }
      ],
      lessons: [
        {
          id: 'u2-partA-talk',
          title: "Part A Let's talk",
          titleCn: '介绍家人',
          lines: [
            { en: "Mum! Dad! This is my friend, Sarah.", cn: '妈妈！爸爸！这是我的朋友萨拉。' },
            { en: 'Nice to meet you.', cn: '见到你很高兴。' },
            { en: 'Nice to meet you too.', cn: '见到你（我）也很高兴。' },
            { en: 'This is my grandma.', cn: '这是我的（外）祖母。' },
            { en: 'This is my grandpa.', cn: '这是我的（外）祖父。' },
            { en: 'Look! This is my family.', cn: '看！这是我的家庭。' }
          ],
          audio: 'audio/unit2/u2-partA-talk.mp3'
        },
        {
          id: 'u2-partB-talk',
          title: "Part B Let's talk",
          titleCn: '不同的家庭',
          lines: [
            { en: 'Is that your brother?', cn: '那是你的兄弟吗？' },
            { en: 'No, it\'s my cousin.', cn: '不，那是我的堂（表）兄弟。' },
            { en: 'Is that your sister?', cn: '那是你的姐妹吗？' },
            { en: 'Yes, it is.', cn: '是的。' },
            { en: 'Families are different, but family love is the same.', cn: '家庭各不相同，但家人的爱是一样的。' }
          ],
          audio: 'audio/unit2/u2-partB-talk.mp3'
        }
      ]
    },
    {
      id: 'unit3',
      number: 3,
      title: 'Amazing animals',
      titleCn: '神奇的动物',
      words: [
        { en: 'bird', cn: '鸟', phonetic: '/bɜːd/' },
        { en: 'cat', cn: '猫', phonetic: '/kæt/' },
        { en: 'cute', cn: '可爱的', phonetic: '/kjuːt/' },
        { en: 'dog', cn: '狗', phonetic: '/dɒɡ/' },
        { en: 'elephant', cn: '大象', phonetic: '/ˈelɪfənt/' },
        { en: 'fast', cn: '快的', phonetic: '/fɑːst/' },
        { en: 'fish', cn: '鱼', phonetic: '/fɪʃ/' },
        { en: 'fox', cn: '狐狸', phonetic: '/fɒks/' },
        { en: 'giraffe', cn: '长颈鹿', phonetic: '/dʒəˈrɑːf/' },
        { en: 'go', cn: '去', phonetic: '/ɡəʊ/' },
        { en: 'like', cn: '喜欢', phonetic: '/laɪk/' },
        { en: 'lion', cn: '狮子', phonetic: '/ˈlaɪən/' },
        { en: 'Miss', cn: '（学生对女教师的称呼）；女士', phonetic: '/mɪs/' },
        { en: 'monkey', cn: '猴子', phonetic: '/ˈmʌŋki/' },
        { en: 'panda', cn: '大熊猫', phonetic: '/ˈpændə/' },
        { en: 'pet', cn: '宠物', phonetic: '/pet/' },
        { en: 'rabbit', cn: '兔', phonetic: '/ˈræbɪt/' },
        { en: 'red', cn: '红色的', phonetic: '/red/' },
        { en: 'tiger', cn: '老虎', phonetic: '/ˈtaɪɡə(r)/' },
        { en: 'zoo', cn: '动物园', phonetic: '/zuː/' }
      ],
      lessons: [
        {
          id: 'u3-partA-talk',
          title: "Part A Let's talk",
          titleCn: '谈论宠物',
          lines: [
            { en: 'Good morning!', cn: '早上好！' },
            { en: 'Good morning! Come in.', cn: '早上好！请进。' },
            { en: 'I like your dog.', cn: '我喜欢你的狗。' },
            { en: 'Thanks. Do you have a pet?', cn: '谢谢。你有宠物吗？' },
            { en: 'No, I don\'t. I like fish.', cn: '不，我没有。我喜欢鱼。' }
          ],
          audio: 'audio/unit3/u3-partA-talk.mp3'
        },
        {
          id: 'u3-partB-talk',
          title: "Part B Let's talk",
          titleCn: '谈论野生动物',
          lines: [
            { en: 'Let\'s go to the zoo!', cn: '我们去动物园吧！' },
            { en: 'Great!', cn: '太好了！' },
            { en: 'Look! What\'s this?', cn: '看！这是什么？' },
            { en: 'It\'s a fox.', cn: '是一只狐狸。' },
            { en: 'Miss White, what\'s that?', cn: '怀特老师，那是什么？' },
            { en: 'It\'s a red panda.', cn: '是一只小熊猫。' }
          ],
          audio: 'audio/unit3/u3-partB-talk.mp3'
        }
      ]
    },
    {
      id: 'unit4',
      number: 4,
      title: 'Plants around us',
      titleCn: '身边的植物',
      words: [
        { en: 'air', cn: '空气', phonetic: '/eə(r)/' },
        { en: 'apple', cn: '苹果', phonetic: '/ˈæpl/' },
        { en: 'banana', cn: '香蕉', phonetic: '/bəˈnɑːnə/' },
        { en: 'cake', cn: '蛋糕', phonetic: '/keɪk/' },
        { en: 'cut', cn: '切', phonetic: '/kʌt/' },
        { en: 'draw', cn: '画', phonetic: '/drɔː/' },
        { en: 'eat', cn: '吃', phonetic: '/iːt/' },
        { en: 'flower', cn: '花', phonetic: '/ˈflaʊə(r)/' },
        { en: 'garden', cn: '花园', phonetic: '/ˈɡɑːdn/' },
        { en: 'get', cn: '得到', phonetic: '/ɡet/' },
        { en: 'gift', cn: '礼物', phonetic: '/ɡɪft/' },
        { en: 'grape', cn: '葡萄', phonetic: '/ɡreɪp/' },
        { en: 'grass', cn: '草', phonetic: '/ɡrɑːs/' },
        { en: 'make', cn: '做', phonetic: '/meɪk/' },
        { en: 'new', cn: '新的', phonetic: '/njuː/' },
        { en: 'orange', cn: '橙子；橙色的', phonetic: '/ˈɒrɪndʒ/' },
        { en: 'plant', cn: '种植；植物', phonetic: '/plɑːnt/' },
        { en: 'see', cn: '看见', phonetic: '/siː/' },
        { en: 'sun', cn: '太阳', phonetic: '/sʌn/' },
        { en: 'them', cn: '它们；他们；她们', phonetic: '/ðem/' },
        { en: 'tree', cn: '树', phonetic: '/triː/' },
        { en: 'us', cn: '我们', phonetic: '/ʌs/' },
        { en: 'water', cn: '水；给……浇水', phonetic: '/ˈwɔːtə(r)/' }
      ],
      lessons: [
        {
          id: 'u4-partA-talk',
          title: "Part A Let's talk",
          titleCn: '我们从植物得到什么',
          lines: [
            { en: 'The school gardens need help.', cn: '学校花园需要帮助。' },
            { en: 'We can water the flowers.', cn: '我们可以给花浇水。' },
            { en: 'We can plant new trees.', cn: '我们可以种新树。' },
            { en: 'We can plant trees.', cn: '我们可以种树。' }
          ],
          audio: 'audio/unit4/u4-partA-talk.mp3'
        },
        {
          id: 'u4-partB-talk',
          title: "Part B Let's talk",
          titleCn: '怎样帮助植物',
          lines: [
            { en: 'I like apples.', cn: '我喜欢苹果。' },
            { en: 'I like bananas.', cn: '我喜欢香蕉。' },
            { en: 'The trees can give us fresh air.', cn: '树木可以给我们新鲜空气。' },
            { en: 'We can plant trees.', cn: '我们可以种树。' }
          ],
          audio: 'audio/unit4/u4-partB-talk.mp3'
        }
      ]
    },
    {
      id: 'unit5',
      number: 5,
      title: 'The colourful world',
      titleCn: '多彩的世界',
      words: [
        { en: 'black', cn: '黑色；黑色的', phonetic: '/blæk/' },
        { en: 'blue', cn: '蓝色；蓝色的', phonetic: '/bluː/' },
        { en: 'brown', cn: '棕色；棕色的', phonetic: '/braʊn/' },
        { en: 'colour', cn: '颜色；涂色', phonetic: '/ˈkʌlə(r)/' },
        { en: 'draw', cn: '画', phonetic: '/drɔː/' },
        { en: 'green', cn: '绿色；绿色的', phonetic: '/ɡriːn/' },
        { en: 'great', cn: '好极了；太棒了', phonetic: '/ɡreɪt/' },
        { en: 'make', cn: '做', phonetic: '/meɪk/' },
        { en: 'orange', cn: '橙色；橙色的', phonetic: '/ˈɒrɪndʒ/' },
        { en: 'paint', cn: '用颜料绘画', phonetic: '/peɪnt/' },
        { en: 'pink', cn: '粉色；粉色的', phonetic: '/pɪŋk/' },
        { en: 'purple', cn: '紫色；紫色的', phonetic: '/ˈpɜːpl/' },
        { en: 'red', cn: '红色；红色的', phonetic: '/red/' },
        { en: 'say', cn: '说', phonetic: '/seɪ/' },
        { en: 'white', cn: '白色；白色的', phonetic: '/waɪt/' },
        { en: 'yellow', cn: '黄色；黄色的', phonetic: '/ˈjeləʊ/' }
      ],
      lessons: [
        {
          id: 'u5-partA-talk',
          title: "Part A Let's talk",
          titleCn: '你看见什么颜色',
          lines: [
            { en: 'What colour is it?', cn: '它是什么颜色的？' },
            { en: 'It\'s orange.', cn: '它是橙色的。' },
            { en: 'What colour is it?', cn: '它是什么颜色的？' },
            { en: 'It\'s green.', cn: '它是绿色的。' },
            { en: 'Blue and yellow make green.', cn: '蓝色和黄色组成绿色。' }
          ],
          audio: 'audio/unit5/u5-partA-talk.mp3'
        },
        {
          id: 'u5-partB-talk',
          title: "Part B Let's talk",
          titleCn: '颜色怎样帮助我们',
          lines: [
            { en: 'What colours do you like?', cn: '你喜欢什么颜色？' },
            { en: 'I like red and pink.', cn: '我喜欢红色和粉色。' },
            { en: 'OK. Let\'s draw some purple and brown birds.', cn: '好的。我们来画一些紫色和棕色的鸟吧。' },
            { en: 'Great! Let\'s draw some purple and brown birds.', cn: '太棒了！我们来画一些紫色和棕色的鸟吧。' }
          ],
          audio: 'audio/unit5/u5-partB-talk.mp3'
        }
      ]
    },
    {
      id: 'unit6',
      number: 6,
      title: 'Useful numbers',
      titleCn: '有用的数字',
      words: [
        { en: 'cake', cn: '蛋糕', phonetic: '/keɪk/' },
        { en: 'count', cn: '数数', phonetic: '/kaʊnt/' },
        { en: 'egg', cn: '蛋', phonetic: '/eɡ/' },
        { en: 'five', cn: '五', phonetic: '/faɪv/' },
        { en: 'four', cn: '四', phonetic: '/fɔː(r)/' },
        { en: 'fun', cn: '乐趣', phonetic: '/fʌn/' },
        { en: 'jump', cn: '跳', phonetic: '/dʒʌmp/' },
        { en: 'many', cn: '许多', phonetic: '/ˈmeni/' },
        { en: 'number', cn: '数字', phonetic: '/ˈnʌmbə(r)/' },
        { en: 'one', cn: '一', phonetic: '/wʌn/' },
        { en: 'people', cn: '人；人们', phonetic: '/ˈpiːpl/' },
        { en: 'plus', cn: '加', phonetic: '/plʌs/' },
        { en: 'see', cn: '看见', phonetic: '/siː/' },
        { en: 'stick', cn: '木棍；手杖', phonetic: '/stɪk/' },
        { en: 'tasty', cn: '美味的', phonetic: '/ˈteɪsti/' },
        { en: 'three', cn: '三', phonetic: '/θriː/' },
        { en: 'two', cn: '二', phonetic: '/tuː/' },
        { en: 'zero', cn: '零', phonetic: '/ˈzɪərəʊ/' }
      ],
      lessons: [
        {
          id: 'u6-partA-talk',
          title: "Part A Let's talk",
          titleCn: '我们什么时候用数字',
          lines: [
            { en: 'How many apples?', cn: '有多少个苹果？' },
            { en: 'Two.', cn: '两个。' },
            { en: 'How many bananas?', cn: '有多少根香蕉？' },
            { en: 'Three. And one orange.', cn: '三根。还有一个橙子。' },
            { en: 'Great! Let\'s eat!', cn: '太好了！我们吃吧！' }
          ],
          audio: 'audio/unit6/u6-partA-talk.mp3'
        },
        {
          id: 'u6-partB-talk',
          title: "Part B Let's talk",
          titleCn: '数字多么有用',
          lines: [
            { en: 'One more cut for the dog.', cn: '再切一块给狗。' },
            { en: 'How old are you?', cn: '你几岁了？' },
            { en: 'I\'m five years old.', cn: '我五岁了。' },
            { en: 'Me too.', cn: '我也是。' },
            { en: 'Happy birthday!', cn: '生日快乐！' }
          ],
          audio: 'audio/unit6/u6-partB-talk.mp3'
        }
      ]
    }
  ]
};

/** 为每个单词生成音频占位路径（可自行替换） */
PEP_GRADE3_BOOK.units.forEach((unit) => {
  unit.words.forEach((word) => {
    word.audio = `audio/${unit.id}/words/${word.en}.mp3`;
  });
});
