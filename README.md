# Track Changes Plugin for CKEditor

* Track changes plugin for CKEditor, based on <a href="https://github.com/NYTimes/ice" target="_blank">ICE</a> (NYTimes track changes for <code>contentEditable</code> documents). 

## Main Features

- Enable / disable track changes mode
- Show / hide tracked changes
- Accept/Reject all/some changes
- Accept/Reject a single change
- Display customizable tooltips for each change

##Demo

[Demo Page](http://www.loopindex.com/lite/demo)

##Site
[LoopIndex](http://www.loopindex.com/lite)

##Getting Started
- Add the lite plugin to ckeditor. The simplest way to do this is by adding the following line to ckeditor's <code>config.js</code>:
```javascript
	config.extraPlugins = 'lite';
```
- Optionally include <code>lite_interfaces.js</code> in your source, so you can use the various constants defined in it rather than string literals.
```javascript
	<script type="text/javascript" src="ckeditor/plugins/lite/lite_interface.js"></script>
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

<li><h3>acceptAll(options)</h3>
Accept some or all the pending changes.
<h4>Parameters</h4>
<ul>
<li><code>options</code> - optional object filter the changes to which this operation applies with the following properties:
<ul><li><code>exclude</code><div>an array of user ids to exclude from the the operation (takes precedence over <code>include</code>)</div>
<li><code>include</code><div>an array of user ids to include from the the operation</div>
<li><code>filter</code><div>a filter function that accepts an object of the form <code>{userid, time, data}</code> and returns a <code>boolean</code>. Only changes for which the filter returns <code>true</code> are included in the operation. The <code>filter</code> option can work with both <code>exclude</code> and <code>include</code>.</div>
</ul>
All the fields you include in the <code>options</code> block, including custom ones, are preserved when it is sent back in the <code>ACCEPT</code> or <code>REJECT</code> events (see below).
<li><h3>rejectAll(options)</h3>
Reject all the pending changes.
<h4>Parameters</h4>
<ul>
<li><code>options</code> - optional object to filter the changes to which this operation applies. See the <code>acceptAll</code> method for details.
</ul>

<li><h3>countChanges(options)</h3>
Returns a count of the tracked changes in the editor.
<h4>Parameters</h4>
<ul>
<li><code>options</code> - optional object to filter the counted changes. See the <code>acceptAll</code> method for details.
</ul>

<li><h3>hasChanges()</h3>
Sets the name and id of the current user. Each tracked change is associated with a user id. 
<h4>Parameters</h4>
<ul>
<li>none
</ul>

<li><h3>setUserInfo(info)</h3>
Sets the name and id of the current user. Each tracked change is associated with a user id. 
<h4>Parameters</h4>
<ul>
<li><code>info</code> - An object with two members - <code>id</code> and <code>name</code>
</ul>

<li><h3>setChangeData(data)</h3>
Associates an arbitrary string with the changes made from now on. This string is passed to the optional <code>filter</code> function in <code>options</code> block passed to various methods that accept change filtering. For example, you may associate a revision number with the current change set and later on filter changes according to their revision.
<h4>Parameters</h4>
<ul>
<li><code>data</code> - Arbitrary data (converted to a string by the <code>LITE</code> plugin).
</ul>



</ul>

## Events
The LITE plugin events are listed in <code>lite_interface.js</code> under <code>LITE.Events</code>. The following events are fired by the LITE plugin instance through its instance of <code>ckeditor</code>, with the parameter in the <code>data</code> member of the event info:
<ul>
<li>INIT (parameters: lite, the LITE instance)<div>Fired each time <code>LITE</code> creates and initializes an instance of the <code>ICE</code> change tracker. This happens, e.g., when you switch back from <code>Source</code> mode to <code>Wysiwyg</code>.</div>
<li>ACCEPT(parameter : the <code>options</code> object passed to acceptAll, if relevant)<div>Fired after some changes (possibly all) were accepted.
<li>REJECT (parameter : the <code>options</code> object passed to acceptAll, if relevant)<div>Fired after some changes (possibly all) were rejected. </div>
<li>SHOW_HIDE(parameter: show &lt;boolean&gt;)
<div>Fired after a change in the visibility of tracked changes.</div>
<li>TRACKING (parameter: tracking&lt;boolean&gt;)
<div>Fired after a change in the change tracking state.</div>

</ul>


##Known Issues
* Adjacent changes from different collaborators may affect each other if you accept/reject a single change in the sequence. This is related to an issue in ICE which we hope to resolve with the developers.
* See the <a href="https://github.com/NYTimes/ice/blob/master/README.md" target="_blank">ICE page</a> for known issues related to ICE.
* Note that the ICE engine adds markup to the editor content. 
* LITE tracks only text insertion and deletion. Other changes, such as style edits, are not tracked.

##Browser Compatibility
LITE has been tested on Firefox 15+, Chrome 13+ and MSIE 9+. Support for MSIE 8 is not guaranteed, although the current version seems to work on it.

##License

Copyright (c) LoopIndex.

<h4>LGPL</h4>

This program is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License along with this program as the file lgpl.txt. If not, see <http://www.gnu.org/licenses/lgpl.txt>

<h4>MPL</h4>

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.

<br>
Written by (David *)Frenkiel (https://github.com/imdfl)
