import constants from "./Constants.mjs";

export default class Speech {

    constructor() {
        let key = game.settings.get(constants.moduleName, "subscriptionKey");
        let region = game.settings.get(constants.moduleName, "region");
        this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);

        if (navigator.mediaDevices == undefined) {
            ui.notifications.warn(game.i18n.localize("voxludos.warn.noAudioDevice"))
        }
    }

    connectMicrophone() {
	 	let lang = game.settings.get(constants.moduleName, "lang");
	 	this.speechConfig.speechRecognitionLanguage = lang;
        const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
        this.recognizer = new SpeechSDK.SpeechRecognizer(this.speechConfig, audioConfig);
    }

    connectSpeaker() {
		this.player = new SpeechSDK.SpeakerAudioDestination();
		this.player.status = "stop";
		this.player.onAudioEnd = function() {
			this.status = "stop";
			this.close();
		};
        const audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(this.player);
        this.synthesizer = new SpeechSDK.SpeechSynthesizer(this.speechConfig, audioConfig);
    }

    async transcribe(actor) {
        if (this.recognizer == undefined) {
            this.connectMicrophone();
        }
        $(".fvtt-speak").addClass("recording");
        await this.recognizer.recognizeOnceAsync(
            function (result)
            {
                $(".fvtt-speak").removeClass("recording");
                ChatMessage.create({"content": result.text, "speaker": { "actor": actor.id }, "type": 2})
            },
            function (error) { console.log(error); }
        );
    }

    async speakText(text, args = null) {
		if(this.player && this.player.status === "play"){
			this.player.status = "pause";
			this.player.pause(); 
		}else if (this.player && this.player.status === "pause"){
			this.player.status = "play";
			this.player.resume();
		}else{	        
			if (this.synthesizer == undefined)
	            this.connectSpeaker();
	        let voice = args?.voice || game.settings.get(constants.moduleName, "voice");
	        let lang = args?.lang || game.settings.get(constants.moduleName, "lang");
	        let style = args?.style || game.settings.get(constants.moduleName, "style");
	        let volume = args?.volume || game.settings.get(constants.moduleName, "volume");
	        let rate = (args?.rate || game.settings.get(constants.moduleName, "rate"))+"%";
	        let pitch = (args?.pitch || game.settings.get(constants.moduleName, "pitch")+"%");
	        let ssml =
	            `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version=\"1.0\" xml:lang="${lang}">` +
	            `<voice name="${voice}">` +
	            `  <mstts:express-as style="${style}">` +
	            `    <prosody rate="${rate}" pitch="${pitch}" volume='${volume}'>` +
	                    text +
	            "    </prosody>" +
	            "  </mstts:express-as>" +
	            "</voice>" +
	            "</speak>";
	        this.player.status = "play";
	        this.synthesizer.speakSsmlAsync(ssml, result=>{completeSpeak(result)}, err => {this.completeSpeak(err)});
    	}
    }
    
    completeSpeak(args){
		this.synthesizer.close();
        this.synthesizer = undefined;		
		if(args){
			console.log(args);
        }
	}
	
	stopSpeak(args){
		if(this.player != undefined){
			this.player.internalAudio.currentTime = this.player.internalAudio.duration;
		}
		if(args){
			console.log(args);
		}
	}
    
    pauseResume(){
		if(this.player != undefined){
			if(this.status == "play"){
				this.status = "pause";
				this.player.pause(); 
			}else if (this.status =="pause"){
				this.status = "play";
				this.player.resume();
			}else{
				console.log("System not speaking");
			}
		}
	}
    
    async getVoicesList(){
		let voiceList = new Array();
		if(!this.synthesizer){
			if(!this.speechConfig){
				let key = game.settings.get(constants.moduleName, "subscriptionKey");
        		let region = game.settings.get(constants.moduleName, "region");
        		this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
			}
			this.connectSpeaker();
		}
		let voices_result = await this.synthesizer.getVoicesAsync();
		voices_result.voices.forEach(function(v){
			voiceList[v.shortName] = v.shortName + " " + (v.gender==1?"(Female)":"(Male)");
		});
		console.log(voiceList);
		return voiceList;
	}
	
	async getLanguageList(){
		let langList = new Array();		
		if(!this.synthesizer){
			this.connectSpeaker();
		}
		let voices_result = await this.synthesizer.getVoicesAsync();
		voices_result.voices.forEach(function(v){
			langList[v.locale] = v.locale;	
		});
		console.log(langList);
		return langList;
	}
}

