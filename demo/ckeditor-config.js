CKEDITOR.editorConfig = function( config ) {
/*	config.toolbar = [
	{ name: 'document', groups: [ 'mode', 'document', 'doctools' ], items: [ 'savebtn', 'Preview', 'Print', '-', 'Templates' ] },
	{ name: 'clipboard', groups: [ 'clipboard', 'undo' ], items: [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
	{ name: 'editing', groups: [ 'find', 'selection', 'spellchecker' ], items: [ 'Find', 'Replace', '-', 'SelectAll', '-', 'Scayt' ] },
	{ name: 'links', items: [ 'Link', 'Unlink', 'Anchor' ] },
	{ name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ], items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl' ] },
	{ name: 'insert', items: [ 'Image', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak'] },
	'/',
	{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat' ] },
	{ name: 'styles', items: [ 'Styles', 'Format', 'Font', 'FontSize' ] },
	{ name: 'colors', items: [ 'TextColor', 'BGColor' ] },
	{ name: 'tools', items: [ 'Maximize', 'ShowBlocks','Source' ] },
	{ name: 'others', items: [ '-' ] },
	{ name: 'lite', items:["lite_ToggleTracking"] },
	{ name: 'about', items: [ 'About' ] }
	]; */
	
	var lite = config.lite = config.lite || {};
	config.extraPlugins = 'lite';
	lite.includes_debug = ["js/rangy/rangy-core.js", "js/ice.js", "js/dom.js", "js/selection.js", "js/bookmark.js","lite_interface.js"];
	lite.includes = ["lite-includes.min.js"];
	lite.includes_full = ["lite-includes.js"];
	// set to false if you want change tracking to be off initially
	lite.isTracking = true;
	lite.userStyles = {
			"21": 3,
			"15": 1,
			"18": 2
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