const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const keep_alive = require('./keep_alive.js')

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Configuration
const CONFIG = {
    TOKEN: 'MTQyNDUyMzIxNDk0MzU1NTYwNA.GJUEAq.mbF18UA5fn8DuMtycj0OaNUwEzsH124IktgWm8', // Replace with your actual token
    TICKET_CATEGORY: 'Tickets',
    TRANSCRIPT_CHANNEL: 'ticket-logs',
    STAFF_ROLE: 'Staff',
    PREFIX: '!',
    EMBED_COLOR: '#2b2d31',
    SERVER_NAME: 'SriLife Roleplay',
    SERVER_LOGO: 'https://res.cloudinary.com/dzummwk1a/image/upload/v1758656689/SriLife_RP_Logo_01_lb30r1.png'
};

let ticketCounter = 1;

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} is online!`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
});

// Command: Setup ticket panel
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(CONFIG.PREFIX)) return;

    const args = message.content.slice(CONFIG.PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ticket-setup') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ You need Administrator permission to use this command!');
        }

        const embed = new EmbedBuilder()
            .setTitle(`Welcome to ${CONFIG.SERVER_NAME} Support! 🛠️`)
            .setDescription(
                `Our Ticket Support System is here to assist you with any inquiries or issues related to SriLife Roleplay. Whether you need help with gameplay, technical support, account issues, or general questions, simply open a ticket and our team will assist you as soon as possible.`
            )
            .setColor(CONFIG.EMBED_COLOR)
            .setThumbnail(CONFIG.SERVER_LOGO)
            .setImage('https://res.cloudinary.com/dzummwk1a/image/upload/v1759704051/01_vpccwq.png')
            .setFooter({ text: ` © ${CONFIG.SERVER_NAME} by 2025 All Right Reserved!` })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_fivem')
                    .setLabel('🛠️ FIVEM Issues')
                    .setStyle(ButtonStyle.Secondary),
                    
                new ButtonBuilder()
                    .setCustomId('ticket_report')
                    .setLabel('⚠️ Report Your Problems')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {});
    }
});

// Button interaction handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // Create ticket buttons
    if (interaction.customId.startsWith('ticket_')) {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const member = interaction.member;

        // Check if user already has an open ticket
        const existingTicket = guild.channels.cache.find(
            c => c.topic === `Ticket by ${member.id}` && c.name.includes('ticket')
        );

        if (existingTicket) {
            return interaction.editReply({
                content: `❌ You already have an open ticket: ${existingTicket}`,
                ephemeral: true
            });
        }

        // Determine ticket type
        let ticketType = '';
        let ticketEmoji = '';
        switch(interaction.customId) {
            case 'ticket_fivem':
                ticketType = 'fivem';
                ticketEmoji = '🛠️';
                break;
            case 'ticket_report':
                ticketType = 'report';
                ticketEmoji = '⚠️';
                break;
        }

        // Find or create category
        let category = guild.channels.cache.find(
            c => c.name === CONFIG.TICKET_CATEGORY && c.type === ChannelType.GuildCategory
        );

        if (!category) {
            category = await guild.channels.create({
                name: CONFIG.TICKET_CATEGORY,
                type: ChannelType.GuildCategory
            });
        }

        // Find staff role
        const staffRole = guild.roles.cache.find(r => r.name === CONFIG.STAFF_ROLE);

        // Create ticket channel
        const ticketChannel = await guild.channels.create({
            name: `${ticketEmoji}ticket-${ticketCounter.toString().padStart(4, '0')}`,
            type: ChannelType.GuildText,
            parent: category.id,
            topic: `Ticket by ${member.id}`,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: member.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles
                    ]
                },
                ...(staffRole ? [{
                    id: staffRole.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageMessages
                    ]
                }] : [])
            ]
        });

        ticketCounter++;

        // Welcome message in ticket
        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`${ticketEmoji} Ticket Created - ${ticketType.toUpperCase()}`)
            .setDescription(
                `Welcome ${member}!\n\n` +
                `**Thank you for opening a ticket with ${CONFIG.SERVER_NAME}!**\n\n` +
                '**Please provide the following information:**\n' +
                '• Describe your issue in detail\n' +
                '• Include any relevant screenshots or files\n' +
                '• Be patient, a staff member will assist you shortly\n\n' +
                `**Ticket Information:**\n` +
                `• Created by: ${member.user.tag}\n` +
                `• Category: ${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)}\n` +
                `• Time: <t:${Math.floor(Date.now() / 1000)}:F>`
            )
            .setColor(CONFIG.EMBED_COLOR)
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: `${CONFIG.SERVER_NAME} Support System` })
            .setTimestamp();

        const controlRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 Close Ticket')
                    .setStyle(ButtonStyle.Secondary)
            );

        await ticketChannel.send({ 
            content: `${member} ${staffRole ? staffRole : ''}`,
            embeds: [welcomeEmbed], 
            components: [controlRow] 
        });

        await interaction.editReply({
            content: `✅ Your ticket has been created: ${ticketChannel}`,
            ephemeral: true
        });
    }

    // Close ticket button
    if (interaction.customId === 'close_ticket') {
        const channel = interaction.channel;
        
        try {
            // Check if user has permission to close
            const staffRole = interaction.guild.roles.cache.find(r => r.name === CONFIG.STAFF_ROLE);
            const isStaff = staffRole && interaction.member.roles.cache.has(staffRole.id);
            const isOwner = channel.topic && channel.topic.includes(interaction.user.id);

            if (!isStaff && !isOwner && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: '❌ Only staff or the ticket owner can close this ticket!',
                    ephemeral: true
                });
            }

            // Reply immediately
            await interaction.reply('🔒 Closing ticket in 5 seconds...');

            // Extract ticket owner ID from channel topic
            let ticketOwnerId = null;
            if (channel.topic) {
                const topicParts = channel.topic.split(' ');
                if (topicParts.length >= 3) {
                    ticketOwnerId = topicParts[2];
                }
            }

            if (!ticketOwnerId) {
                console.error('Could not extract ticket owner ID from topic');
                await interaction.followUp('⚠️ Could not identify ticket owner, but closing anyway...');
                setTimeout(() => channel.delete().catch(console.error), 5000);
                return;
            }

            // Fetch messages before closing
            let messages = [];
            let messageCount = 0;
            
            try {
                const fetchedMessages = await channel.messages.fetch({ limit: 50 });
                messages = Array.from(fetchedMessages.values()).reverse();
                messageCount = messages.length;
            } catch (err) {
                console.error('Error fetching messages:', err);
            }

            // Build message history
            let messageHistory = '';
            if (messages.length > 0) {
                for (let i = 0; i < Math.min(messages.length, 15); i++) {
                    const msg = messages[i];
                    if (!msg.content) continue;
                    
                    const time = new Date(msg.createdTimestamp).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true
                    });
                    
                    let content = msg.content;
                    if (content.length > 80) {
                        content = content.substring(0, 80) + '...';
                    }
                    
                    messageHistory += `[${time}] ${msg.author.username}: ${content}\n`;
                }
            }

            // Create summary embed
            const summaryEmbed = new EmbedBuilder()
                .setTitle('📋 Ticket Closed - Summary')
                .setColor(CONFIG.EMBED_COLOR)
                .addFields(
                    { name: '🎫 Ticket', value: `${channel.name}`, inline: true },
                    { name: '🏢 Server', value: `${interaction.guild.name}`, inline: true },
                    { name: '👤 Closed By', value: `${interaction.user.tag}`, inline: true },
                    { name: '📊 Messages', value: `${messageCount}`, inline: true },
                    { name: '🕐 Closed At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                )
                .setThumbnail(interaction.guild.iconURL())
                .setFooter({ text: `${CONFIG.SERVER_NAME} Support System` })
                .setTimestamp();

            if (messageHistory.trim()) {
                if (messageHistory.length > 1020) {
                    messageHistory = messageHistory.substring(0, 1020) + '...';
                }
                summaryEmbed.addFields({
                    name: '💬 Message History',
                    value: '```' + messageHistory + '```',
                    inline: false
                });
            }

            // Try to fetch the user and send DM
            try {
                const ticketOwnerUser = await client.users.fetch(ticketOwnerId);
                
                if (ticketOwnerUser) {
                    try {
                        await ticketOwnerUser.send({ embeds: [summaryEmbed] });
                        console.log(`✅ Summary sent to ${ticketOwnerUser.tag}'s DM`);
                        await interaction.followUp(`✅ Transcript summary sent to <@${ticketOwnerId}>'s DM!`);
                    } catch (dmError) {
                        console.error('Could not send DM:', dmError);
                        await interaction.followUp(`⚠️ Could not send DM to <@${ticketOwnerId}>. They may have DMs disabled.`);
                    }
                }
            } catch (fetchError) {
                console.error('Could not fetch user:', fetchError);
                await interaction.followUp(`⚠️ Could not find user <@${ticketOwnerId}>`);
            }

            // Log to transcript channel
            const logChannel = interaction.guild.channels.cache.find(c => c.name === CONFIG.TRANSCRIPT_CHANNEL);
            
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🎫 Ticket Closed')
                    .setDescription(
                        `**Ticket:** ${channel.name}\n` +
                        `**Closed by:** ${interaction.user.tag}\n` +
                        `**Owner:** <@${ticketOwnerId}>\n` +
                        `**Messages:** ${messageCount}\n` +
                        `**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
                    )
                    .setColor('#ff4444')
                    .setTimestamp();

                try {
                    await logChannel.send({ embeds: [logEmbed] });
                } catch (logError) {
                    console.error('Could not log to transcript channel:', logError);
                }
            }

            // Delete channel after delay
            setTimeout(() => {
                channel.delete().catch(err => {
                    console.error('Error deleting channel:', err);
                });
            }, 5000);

        } catch (error) {
            console.error('Error closing ticket:', error);
            await interaction.followUp('⚠️ An error occurred, but the ticket will still close.').catch(() => {});
            setTimeout(() => {
                channel.delete().catch(console.error);
            }, 5000);
        }
    }
});

client.login(CONFIG.TOKEN);