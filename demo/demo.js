function f() {

	var users = [{name: "Roger", id : 18}, {name: "David", id : 15}, {name : "Syd", id : 21}],
		html = '',
		version = (location.search.match(/(\d\.\d)/) || ["4.4"])[0],
		ckeditorConfigUrl = version == "4.2" ? "../ckeditor4.2-config-debug.js" : "../ckeditor-config-debug.js"; 
	
	for (var i = 0, len = users.length; i < len; ++i) {
		var user = users[i];
		var name = "user-" + i;
		var h = '<input type="checkbox" class="user-cb" id="' + name + '" name="' + name + '" data-userid="' + user.id + '" /><label for="'+ name + '">' + user.name + '</label>';
		html += h;
	}
	
	document.getElementById("filters").innerHTML = html;
	$(".ckeditor-version-name").html(CKEDITOR.version);
	$("#editor-tabs").tabs({
		activate: onTabChanged
	});

	function EditorState(editor ) {
		this.editor = editor;
		this.checkedUsers = {};
	}

	var editorStates = {},
		editorId = null,
		$sidebar = $("#sidebar"),
		$select = $sidebar.find("#users"),
		$versions = $sidebar.find("#ckeditor-version-select"),
		_options = $versions[0].options;
	
	jQuery.each(["4.2","4.3","4.4"], function(i, v) {
		_options[i] = new Option("Version " + v, v);
	});
	
	$versions.val(version).change(function(e) {
		var v = $(e.currentTarget).val();
		location.href = location.href.replace(/\?.*/,"") + '?' + v;
	});

	(function() {
		loadEditor('editor1', true);
		loadEditor('editor2', false);
		
		var select = $select[0];
		$.each(users, function(i, user) {
			var option  = new Option(user.name, user.id);
			select.options[i] = option;
		});
		$select.change(onUserChanged);
	})();
	
	$.each(editorStates, function(i, state) {
		// example of listening to an LITE plugin event. The events are dispatched through the editor
		state.editor.on(LITE.Events.SHOW_HIDE, function(event) {
			var show = event.data.show;
			$sidebar.find("#show-status").text(show ? "Shown" : "Hidden").toggleClass("on", show);
	
		});
	
		// called each time a new instance of an LITE tracker is created
		state.editor.on(LITE.Events.INIT, function(event) {
			var lite = event.data.lite;
			lite.toggleShow(true);
		});
	});
	
	$("#test-data").click(function(event) {
		event.preventDefault();
		var state = editorStates[editorId];
		if (state) {
			state.editor.setData('<p>Aug 11 2013</p><p><span class="ice-ins ice-cts-1" data-cid="2" data-time="1376218678796" data-userid="15" data-username="David" >Added by David</span>, then <span class="ice-ins ice-cts-2" data-cid="11" data-time="1376218687062" data-userid="18" data-username="Roger" >added by Roger</span>, subsequently <span class="ice-del ice-cts-3" data-cid="3" data-time="1376243289388" data-userid="21" data-username="Syd" >deleted by Syd</span>, then <span class="ice-ins ice-cts-3" data-cid="19" data-time="1376218693458" data-userid="21" data-username="Syd" >added by Syd</span> using the <b>Track Changes CKEditor Plugin</b>.</p><p>Aug 11 2000</p><p><span class="ice-ins ice-cts-1" data-cid="21" data-time="966006011847" data-userid="15" data-username="David" >Added by David</span>, then <span class="ice-ins ice-cts-2" data-cid="111" data-time="966006011847" data-userid="18" data-username="Roger" >added by Roger</span>, subsequently <span class="ice-del ice-cts-3" data-cid="113" data-time="966006011847" data-userid="21" data-username="Syd" >deleted by Syd</span>, then <span class="ice-ins ice-cts-3" data-cid="119" data-time="966006011847" data-userid="21" data-username="Syd" >added by Syd</span> using the <b>Track Changes CKEditor Plugin</b>.</p>');
		}
		return false;
	});
	
	$("#reload-editor").click(function(event) {
		event.preventDefault();
		var state = editorStates[editorId];
		if (state) {
			state.editor.destroy();
			loadEditor(editorId);
		}
		return false;
	});
	
	$("#reject-match").click(function(event) {
		event.preventDefault();

		var state = editorStates[editorId];
		if (state) {
			var checked = getCheckedUsers(),
				lite = state.editor.plugins.lite;
			lite.findPlugin(state.editor).rejectAll({include:checked});
		}
		return false;
	})

	$("#reject-non-match").click(function(event) {
		event.preventDefault();
		var state = editorStates[editorId];
		if (state) {
			var checked = getCheckedUsers(),
				lite = state.editor.plugins.lite;
			lite.findPlugin(state.editor).rejectAll({exclude:checked});
		}
		return false;
	});

	$("#accept-match").click(function(event) {
		event.preventDefault();
		var state = editorStates[editorId];
		if (state) {
			var checked = getCheckedUsers(),
				lite = state.editor.plugins.lite;
			lite.findPlugin(state.editor).acceptAll({include:checked});
		}
		return false;
	});
	
	$("#accept-non-match").click(function(event) {
		event.preventDefault();
		var state = editorStates[editorId];
		if (state) {
			var checked = getCheckedUsers(),
				lite = state.editor.plugins.lite;
			lite.findPlugin(state.editor).acceptAll({exclude:checked});
		}
		return false;
	});
	
	function onTabChanged(event, ui) {
		var id = ui.newPanel.find("textarea").attr("id");
		var oldId = ui.oldPanel && ui.oldPanel.find("textarea").attr("id");
		onEditorSelected(id, oldId);
	}
	
	function loadEditor(id, focus) {
		
		var state = editorStates[id];
		if (state) {
			$('#'+id).val("This editor was <strong>reloaded</strong>");
		}
		
		var editor = CKEDITOR.replace( id , { 
			height: "400" ,
			customConfig: ckeditorConfigUrl
		});
		
		function onConfigLoaded(e) {
			var conf = e.editor.config;
			var lt = conf.lite = conf.lite || {};
			if (location.href.indexOf("debug") > 0) {
				lt.includeType = "debug";
			} 
		}

		editor.on('configLoaded', onConfigLoaded);
		
		if (focus) {
			editor.on(LITE.Events.INIT, function(event) {
				onEditorSelected(id);
			});

			editor.on("loaded", function(e) {
				onEditorSelected(id);
			});
		}

		editorStates[id] = new EditorState(editor);
	}
	
	function onEditorSelected(id, oldId) {
		var state = editorStates[oldId];
		if (state) {
			var checks = getCheckedUsers();
			var c = {};
			checks.each(function(i,e) {
				c[e] = true;
			});
			state.checkedUsers = c;
		}
		
		state = editorStates[id];
		if (! state) {
			return;
		}
		
		editorId = id;
		selectUser(state.userId||users[0].id, true);
		setCheckedUsers(state.checkedUsers);
		state.editor.focus();
	}
		
	function onUserChanged(event) {
		var target = event.currentTarget;
		var id = $(target).val();
		selectUser(id);
		var state = editorStates[editorId];
		state && state.editor.focus();
	}
	
	function selectUser(id, inUI) {
		if (inUI) {
			return $select.val(id).change();
		}
		var i;
		for (i = 0; i < users.length; ++i) {
			if (users[i].id == id) {
				break;
			}
		}
		var user = users[i];
		var state = editorStates[editorId];
		if (user && state) {
			state.userId = id;
			var lite = state.editor.plugins.lite;
			lite && lite.findPlugin(state.editor).setUserInfo(user);
		}
	}
	
	function getCheckedUsers() {
		var checks = $("#filters input:checked");
		var checked = checks.map(function(i,e) {
			return $(e).attr("data-userid");
		});
		return checked;
	}
	
	function setCheckedUsers(checked) {
		var $checks = $("#filters input[type=checkbox]");
		checked = checked || {};
		$checks.each(function(i,e) {
			var $e = $(e);
			var id = $e.attr("data-userid");
			$e.prop("checked", id in checked);
		});
	}
	

	


}
if (typeof(jQuery) == "undefined" || typeof(CKEDITOR) == "undefined") {
	alert("To run this demo, please install ckeditor in a folder called ckeditor next to the demo file, then install the LITE plugin as described in the documentation. Thanks.");
}
else {
	$(window).load(f);
}


(function() {
	/* Begin fixes for IE */
	Function.prototype.bind = Function.prototype.bind || function () {
		"use strict";
		var fn = this, args = Array.prototype.slice.call(arguments),
		object = args.shift();
		return function () {
			return fn.apply(object,
		args.concat(Array.prototype.slice.call(arguments)));
		};
	};

	/* Mozilla fix for MSIE indexOf */
	Array.prototype.indexOf = Array.prototype.indexOf || function (searchElement /*, fromIndex */) {
		"use strict";
		if (this == null) {
			throw new TypeError();
		}
		var t = Object(this);
		var len = t.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = 0;
		if (arguments.length > 1) {
			n = Number(arguments[1]);
			if (n != n) { // shortcut for verifying if it's NaN
				n = 0;
			} else if (n != 0 && n != Infinity && n != -Infinity) {
				n = (n > 0 || -1) * Math.floo1r(Math.abs(n));
			}
		}
		if (n >= len) {
			return -1;
		}
		var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
		for (; k < len; k++) {
			if (k in t && t[k] === searchElement) {
				return k;
			}
		}
		return -1;
	};

	/* Mozilla fix for MSIE lastIndexOf */
	Array.prototype.lastIndexOf = Array.prototype.indexOf || function (searchElement /*, fromIndex */) {
		"use strict";
		if (this == null) {
			throw new TypeError();
		}
		var t = Object(this);
		var len = t.length >>> 0;
		while(--len >= 0) {
			if (len in t && t[len] === searchElement) {
				return len;
			}
		}
		return -1;
	};
/* End fixes fo IE */

})();