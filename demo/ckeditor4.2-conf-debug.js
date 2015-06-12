CKEDITOR.editorConfig = function( config ) {
	var lite = config.lite = config.lite || {};
	config.extraPlugins = 'lite';
	config.removePlugins = 'pagebreak';
//	lite.includes  = ["js/rangy/rangy-core.js", "js/ice.js", "js/dom.js", "js/selection.js", "js/bookmark.js","lite-interface.js"];
	lite.isTracking = true;
	lite.userStyles = {
		15: 1,
		18:2,
		21:3
	};
	// these are the default tooltip values. If you want to use this default configuration, just set lite.tooltips = true;
	lite.tooltips = {
		show: true,
		path: "js/opentip-adapter.js",
		classPath: "OpentipAdapter",
		cssPath: "css/opentip.css",
		delay: 500
	};
//	lite.commands = [/*LITE.Commands.TOGGLE_TRACKING, */LITE.Commands.TOGGLE_SHOW/*, LITE.Commands.ACCEPT_ALL, LITE.Commands.REJECT_ALL, LITE.Commands.ACCEPT_ONE, LITE.Commands.REJECT_ONE */];
	config.enterMode = CKEDITOR.ENTER_BR;
	config.autoParagraph = false;
	config.title = false;
};