# ICE plugin for CKEditor

* Track changes plugin for CKEditor, based on <a href="https://github.com/NYTimes/ice" target="_blank">ICE</a> (NYTimes track changes for <code>contentEditable</code> documents). 
* The LITE plugin contains an edited version of ICE, we hope to merge with the ICE repository in the near future.

## Main Features

- Enable / disable track changes mode
- Show / hide tracked changes
- Accept all changes
- Reject all changes
- Accept a single change
- Reject a single change 
- Display timestamp and user info for each change

##Demo

[Demo Page](http://www.loopindex.com/lite/demo)

##Site
[LoopIndex](http://www.loopindex.com/lite)

##Getting Started
- Include the lite plugin's interface in your html, e.g.
```javascript
	<script type="text/javascript" src="ckeditor/plugins/lite/lite_interface.js"></script>
```

- Add the lite plugin to ckeditor. The simplest way to do this is by adding the following line to ckeditor's <code>config.js</code>:
```javascript
	config.extraPlugins = 'lite';
```
- See the <a href="http://www.loopindex.com/lite/docs/" target="_blank">documentation</a> for all the configuration options.

##Configuration
The LITE plugin is automatically activated after you install it and edit <code>config.js</code> as described above. For the full details of tweaking the loading process, toolbar commands, users and more, see the <a href="http://www.loopindex.com/lite/docs/" target="_blank">documentation</a>.

## API
<ul>
<li><h3>Get a reference to the lite plugin</h3>
To interact with the <code>lite</code> plugin, either access it through the editor's <code>plugins.lite</code> property, or listen to the event <code>LITE.Events.INIT</code> fired by the editor instance. The <code>data</code> member of the event will
contain a property called <code>lite</code> which references the lite plugin instance, initialized and ready for action.
<li><h3>toggleTracking(bTrack, bNotify)</h3>
Toggles change tracking in the editor. 
<h4>Parameters</h4>
<ul>
<li><code>bTrack</code> - boolean. If <code>undefined</code>, change tracking is toggled, otherwise it is set to this value
<li><code>bNotify</code> - boolean. If false, the <code>LITE.Events.TRACKING</code> event is not fired.
</ul>
<li><h3>toggleShow(bShow, bNotify)</h3>
Change the visibility of tracked changes. Visible changes are marked by a special style, otherwise insertions appear in their original format and deletions are hidden.
<h4>Parameters</h4>
<ul>
<li><code>bShow</code> - boolean. If <code>undefined</code>, change visibility is toggled, otherwise it is set to this value
<li><code>bNotify</code> - boolean. If false, the <code>LITE.Events.SHOW_HIDE</code> event is not fired.
</ul>

<li><h3>acceptAll</h3>
Accept all the pending changes.

<li><h3>rejectAll</h3>
Reject all the pending changes.

<li><h3>setUserInfo(info)</h3>
Sets the name and id of the current user. Each tracked change is associated with a user id. 
<h4>Parameters</h4>
<ul>
<li><code>info</code> - An object with two members - <code>id</code> and <code>name</code>
</ul>

</ul>

## Events
The LITE plugin events are listen in <code>lite_interface.js</code> under <code>LITE.Events</code>. The following events are fired by the LITE plugin instance, with the parameter in the <code>data</code> member of the event info:
<ul>
<li>INIT (parameters: lite, the LITE instance)<div>Fired each time <code>LITE</code> creates and initializes an instance of the <code>ICE</code> change tracker. This happens, e.g., when you switch back from <code>Source</code> mode to <code>Wysiwyg</code>.</div>
<li>ACCEPT_SOME (parameter : none)<div>Fired after some changes (but not all) were accepted. Out of the box, this is fired only when the <code>LITE.Commands.ACCEPT_ONE</code> command is executed.</div>
<li>ACCEPT_ALL (parameter : none)
<div>Fired after the all pending changes are accepted.</div> 
<li>REJECT_SOME (parameter : none)<div>Fired after some changes (but not all) were rejected. Out of the box, this is fired only when the <code>LITE.Commands.REJECT_ONE</code> command is executed.</div>
<li>REJECT_ALL (parameter : none)
<div>Fired after the all pending changes are rejected.</div> 
<li>SHOW_HIDE(parameter: show &lt;boolean&gt;)
<div>Fired after a change in the visibility of tracked changes.</div>
<li>TRACKING (parameter: tracking&lt;boolean&gt;)
<div>Fired after a change in the change tracking state.</div>

</ul>


##Known Issues
* Adjacent changes from different collaborators may affect each other if you accept/reject a single change in the sequence. This is related to an issue in ICE which we hope to resolve with the developers.
* See the <a href="https://github.com/NYTimes/ice/blob/master/README.md" target="_blank">ICE page</a> for known issues related to ICE.

##License

Copyright (c) LoopIndex.

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License, version 2, as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program as the file gpl-2.0.txt. If not, see <http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt>
