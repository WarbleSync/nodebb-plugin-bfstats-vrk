<form role="form" class="bfstats-settings">
	<div class="row">
		<div class="col-sm-12 col-xs-12">
			<p class="lead">
				This plugin uses TRN Battlefield API for data. Retrieves both BF4 and BF1 stats based on Origin ID.
			</p>
		</div>
	</div>
	<div class="col-sm-12 col-xs-12">
		<div class="form-group">
			<label for="apiKey">TRN-Api-Key</label>
			<input type="text" id="apiKey" name="apiKey" title="apikey" class="form-control" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/>
		</div>
		<div class="form-group">
			<label for="updateTime">Update Time (in cron format):</label>
			<input type="text" id="updateTime" name="updateTime" title="Update Time" class="form-control" placeholder="Example: 15 0 * * *"/>
		</div>
	</div>
	<div class="col-sm-12 col-xs-12 text-right">
		<button id="updateStats" class="btn btn-primary">Update Stats</button>
	</div>
</form>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>
