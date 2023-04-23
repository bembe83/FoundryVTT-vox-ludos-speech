import Speech from "./Speech.mjs";
import Settings from "./Settings.mjs";
import constants from "./Constants.mjs";

Hooks.on('renderActorSheet', function(sheet, html, data) {

    let configureSheet = html.find('.configure-sheet');

    let toAppend = `<a class="fvtt-speak"><i class="fas fa-microphone"></i>${game.i18n.localize("voxludos.controls.speak")}</a>`;
    if (configureSheet.length == 0) {
        html.find('.close').before(toAppend);
    }
    else {
        configureSheet.before(toAppend);
    }

    html.find(".fvtt-speak").click(async () => {
		let speech = new Speech();
        await speech.transcribe(sheet.actor);
    });

});

Hooks.on('renderChatMessage', function(message, html, data) {
    html.find('.message-delete')
        .before(' <a class="button message-speak"><i class="fas fa-headphones"></i></a>');

    html.find('.message-speak').click(async () => {
        let voiceSettings;
        if (message.speaker?.actor) {
            let speaker = game.actors.get(message.speaker?.actor);
            voiceSettings = {
                voice: speaker.getFlag(constants.moduleName, "voice"),
                lang: speaker.getFlag(constants.moduleName, "lang"),
                style: speaker.getFlag(constants.moduleName, "style"),
                volume: speaker.getFlag(constants.moduleName, "volume"),
                rate: speaker.getFlag(constants.moduleName, "rate"),
                pitch: speaker.getFlag(constants.moduleName, "pitch"),
            };
        }
        let speech = new Speech();
        let messageText = message.content;
        await speech.speakText(messageText, voiceSettings);
    });
});

Hooks.on('renderChatLog', function(directory, html, data) {
    html.find('.control-buttons > .export-log')
        .before('<a class="button fvtt-speak" title="Speak"><i class="fas fa-microphone"></i></a>');

    html.find('.fvtt-speak').click(async () => {
        let actor = undefined;
        if (canvas.tokens.controlled?.length > 0) {
            actor = canvas.tokens.controlled[0].actor;
        }
        else if (game.user.character) {
            actor = game.user.character;
        }
        else {
            ui.notifications.warn(game.i18n.localize("voxludos.warn.noActorSelected"));
            return;
        }
        let speech = new Speech();
        await speech.transcribe(actor);
    })
});

Hooks.on("createChatMessage", async (message) => {
    if (game.settings.get(constants.moduleName, "autoRead")) {
        if (message.user.id != game.user.id) {
			let speech = new Speech();
            await speech.speakText(message.content);
        }
    }
});

Hooks.on('renderJournalTextPageSheet', function(journalPage, html, data) {
    
    html.find('.editor-edit')
        .before(' <a class="button journal-speak"><i class="fas fa-headphones"></i></a>');

    html.find('.journal-speak').click(async () => {
        let speech = new Speech();
        let messageText = journalPage.objecct.name+"\n"+jQuery("<p>"+journalPage.object.text.content+"</p>")
        await speech.speakText(messageText, args);
    });
});


Hooks.once('ready', async function() {
    await Settings.registerSettings();
    //window.game.speech = new Speech();
});
