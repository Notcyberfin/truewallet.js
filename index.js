const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const axios  = require('axios')
const { crearDB } = require('megadb')
const key = new crearDB('key')
const mainkey = new crearDB('mainkey')

const { token, guildID, price, phone, roleID, githubLink } = require('./config.json')

client.on('ready', () => {
  console.log(`${client.user.tag} is ready!`);

  client.api.applications(client.user.id).guilds(guildID).commands.post({data: {
        name: 'buy',
        description: 'สคิปราคา : ' + price,
        options: [
            {
                name: "url",
                description: "[+] : ลิงค์ซองอังเปา",
                type: 3,
                required: true,
            }
        ]
    }
})

    client.api.applications(client.user.id).guilds(guildID).commands.post({data: {
        name: 'getscript',
        description: 'รับสคิปของตัวเอง',
    }
})

    client.api.applications(client.user.id).guilds(guildID).commands.post({data: {
        name: 'redeem',
        description: 'redeem key',
        options: [
            {
                name: "key",
                description: "[+] : script key",
                type: 3,
                required: true,
            }
        ]
    }
})

});

    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var randomkey = '';

    for (var i=0; i< 18 ; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomkey += chars.substring(rnum,rnum+1);
    }

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  await interaction.deferReply({ ephemeral: true }).catch(() => {});

  const args = [];

  for (let option of interaction.options.data) {
    if (option.type === "SUB_COMMAND") {
        if (option.name) args.push(option.name);
        option.options?.forEach((x) => {
            if (x.value) args.push(x.value);
        });
    } else if (option.value) args.push(option.value);
}

  if (interaction.commandName === 'buy') {

    if (!args[0].startsWith('https://gift.truemoney.com/campaign/?v=')) {
        return interaction.followUp('**[!]** `ลิงค์ซองอังเปาไม่ถูกต้อง โปรดตรวจสอบซองอังเปาแล้วลองใหม่อีกครั้ง!`')
    }

    let regex = /(^https:\/\/gift\.truemoney\.com\/campaign\/)\?v=([A-Za-z0-9]{18})/
    var code = new RegExp(regex).exec(args[0])
    code = code[2]

    if (code.length != 18)  return interaction.followUp('**[!]** `ลิงค์ซองอังเปาไม่ถูกต้อง โปรดตรวจสอบซองอังเปาแล้วลองใหม่อีกครั้ง!`')

    axios({
        method: 'post',
        url: 'https://gift.truemoney.com/campaign/vouchers/' + code + '/redeem',
        data : {
            mobile: phone,
            voucher_hash: code
        }
    })
    .then(
        (response) => {
            if (parseInt(response.data.data.voucher.amount_baht) !== Number(price)) return interaction.followUp(`**[!]** โปรดสร้างซองอังเปา \`${price}\` บาท`)

            mainkey.set(randomkey, interaction.user.id)

            interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setColor('GREEN')
                        .setAuthor(
                            client.user.tag,
                            client.user.displayAvatarURL({ dynamic: true })
                        )
                        .setDescription(`**[+]** ซื้อสคิปเรียบร้อย \`/redeem ${randomkey}\` เพื่อรับสคิป`)
                ]
            })

            interaction.member.roles.add(roleID)
        }
    )
    .catch(
        (err) => {
            switch (err.response.data.status.code) {
                case 'CANNOT_GET_OWN_VOUCHER' :
                    interaction.followUp('**[!]** `ไม่สามารถใส่ซองของตัวเองได้`');
                break;
                case 'TARGET_USER_NOT_FOUND':
                    interaction.followUp('**[!]** `ไม่พบเบอร์ที่ใช้รับซองอังเปา โปรดติดต่อแอดมิน`');
                break;
                case 'VOUCHER_OUT_OF_STOCK':
                    interaction.followUp('**[!]** `ซองอังเปานี้ถูกใช้งานไปจนหมดแล้ว โปรดตรวจสอบแล้วลองใหม่ภายหลัง`');
                break;
                case 'VOUCHER_NOT_FOUND':
                    interaction.followUp('**[!]** `ไม่พบซองอังเปาดังกล่าวในระบบ โปรดตรวจสอบแล้วลองใหม่ภายหลัง`');
                break;
                case 'VOUCHER_EXPIRED':
                    interaction.followUp('**[!]** `ซองอังเปานี้หมดอายุแล้ว โปรดตรวจสอบแล้วลองใหม่ภายหลัง`');
                break;
                case 'INTERNAL_ERROR':
                    interaction.followUp('**[!]** `เซิฟเวอร์ ERROR โปรดลองใหม่ภายหลัง`');
                break;
                default:
                    interaction.followUp('**[!]** `เกิดปัญหา 404 โปรดลองใหม่ภายหลัง`');
                break;
            }
        }
    )
    } else if (interaction.commandName === 'redeem') {
        if (!mainkey.has(args[0])) {
            interaction.followUp('**[!]** `ไม่พบ key ดังกล่าว`');
        } else {
            key.set(interaction.user.id, args[0])
            mainkey.delete(args[0])
            interaction.followUp('**[!]** `เรียบร้อย ใช้คำสั่ง /getscript เพื่อรับสคิป`');
        }

    } else if (interaction.commandName === 'getscript') {
      if (!key.has(interaction.user.id)) return interaction.followUp('**[!]** `คุณไม่สามารถใช้คำสั่งนี้ได้`');

      interaction.followUp('**[!]** `เราได้ส่งสคิปใปในแชทส่วนตัวแล้ว!`')
      interaction.user.send({
        embeds: [
            new MessageEmbed()
                .setColor('GREEN')
                .setAuthor(
                    client.user.tag,
                    client.user.displayAvatarURL({ dynamic: true })
                )
                .setDescription(`\`\`\`lua\n_G.key = "${await key.get(interaction.user.id)}"\nloadstring(game:HttpGet("${githubLink}"))();\n\`\`\``)
        ]
    })
  }
});

client.login(token);