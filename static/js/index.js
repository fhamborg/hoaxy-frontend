

function disableInput() {
	$('#loader').show(); //loading sign appear
	$("#query, input[name=include_user_mentions], input[name=sort_by]").prop('disabled', true);
}
function enableInput() {
	$('#loader').hide(); //loading sign disappear
	$("#query, input[name=include_user_mentions], input[name=sort_by]").prop('disabled', false);

}

var colors = {
	node_colors : {
	"fact_checking" : '#1f2041',
	"claim" : '#1f2041'},
	edge_colors : {
	"fact_checking" : '#F46036',
	"fact_checking_dark" : '#cc4f2d',
	"claim" : '#4B3F72',
	"claim_dark" : '#2a2340'
}
};


//opts 可从网站在线制作
var opts = {
    lines: 15, // 花瓣数目
    length: 10, // 花瓣长度
    width: 5, // 花瓣宽度
    radius: 20, // 花瓣距中心半径
    corners: 1, // 花瓣圆滑度 (0-1)
    rotate: 0, // 花瓣旋转角度
    direction: 1, // 花瓣旋转方向 1: 顺时针, -1: 逆时针
    color: '#0275D8', // 花瓣颜色
    speed: 1, // 花瓣旋转速度
    trail: 20, // 花瓣旋转时的拖影(百分比)
    shadow: false, // 花瓣是否显示阴影
    hwaccel: false, //spinner 是否启用硬件加速及高速旋转
    className: 'spinner', // spinner css 样式名称
    zIndex: 2e9, // spinner的z轴 (默认是2000000000)
    top: '50%', // spinner 相对父容器Top定位 单位 px
    left: '50%', // spinner 相对父容器Left定位 单位 px
    position: 'absolute', // Element positioning
};


//data structure for the modal display, either display user or tweet id
var modal_content = {
	cooccurrence: {
		title: "",
		hashtags: []
	},
	tweet_edge: {
		tweet_id: "",
		username: "",
		edgeType: "",
		source: "",
		target: "",
		title: ""
	},
	user: {
		username: "",
		mentioned_by: [],
		mentioned: [],
		retweeted_by: [],
		retweeted: []
	}
};

$(function () {
    $("#submit, #visualize").click(function () {
    });

	$('#btnExportPng').click(function(){
	  var prybar = new Prybar('#chart svg');
	  prybar.exportPng(getFilename('png'), {bg: 'white', converter: 'canvg'});
	});

	$('#btnExportSvg').click(function(){
	  var prybar = new Prybar('#chart svg');
	  prybar.exportSvg(getFilename('svg'));
	});
});

//Step 0 : Get value from Text Box
var chartData = [];
var chart ;
var s =null; //sigma instance
var hiddenColor = 'blue';

var graph = null;
var edges = null;

original_bottom = 0;

//formatting the date
function dateFormatter(d) {
  return d3.time.format('%x')(new Date(d))
}

function updateChart(){
  if(!!chart.update){
    chart.update();
  }
}

/*
* timelineObj:  {"time": time, "cnt_factcheck": cnt_factcheck, "cnt_fake": cnt_fake}
*/
function getBothSeries(timelineObj)
{
	var factChecking_values = timelineObj.factChecking_values;

	var fake_values = timelineObj.fake_values;

	var factChecking_series = {
		key: 'Fact-checks',
		values: factChecking_values,
		c: colors.edge_colors.fact_checking
	};

	var fake_series = {
		key: 'Claims',
		values: fake_values,
		c:colors.edge_colors.claims
	};

	return {'factChecking_series': factChecking_series, 'fake_series': fake_series};
}

// Handle focus chart date changes
/*
Uses Lodash's debounce: https://lodash.com/docs/#debounce
Without debounce, this event will fire many times before you want
it to. The alternative is to listen for the mouseUp event after
getting the brush event, then fire the updateDateRange function.
*/
var updateDateRange = _.debounce(_updateDateRange, 400);
function _updateDateRange(extent){
  $('#extent-0').text(extent.extent[0]);
  $('#extent-1').text(extent.extent[1]);

  $('#extent-00').text(new Date(extent.extent[0]).toISOString());
  $('#extent-11').text(new Date(extent.extent[1]).toISOString());

  var starting_time = extent.extent[0],
		ending_time = extent.extent[1];

  //only proceed when s.graph is ready
  // if (edges)
  try
  {
	console.info("Tried to draw network by updateDateRange");
	graph = Graph(edges, starting_time, ending_time);
	spinStart();
	drawGraph(graph);
	spinStop();

  }
  catch(e)
  {
	  console.info(e, "Will try again in a second.");
	  setTimeout(function(){
		  updateDateRange(extent);
	  }, 500);
  }

}

//Plotting function
function plotData(factChecking_series, fake_series){
  $(".button-container").show();

  chartData.push(fake_series);
  chartData.push(factChecking_series);

  // This adds an event handler to the focus chart
  chart.dispatch.on("brush", updateDateRange);

  d3.select('#chart svg')
    .datum(chartData)
    .call(chart);


}

function retrieveTimeSeriesData(edges)
{
	clearData();
	var timelineObj = timeline(edges);
	var values = getBothSeries(timelineObj);
	plotData(values.factChecking_series, values.fake_series);
}

function getFilename(ext){
  var keys = $.map(chartData, function(x){ return x.key }),
      //startDate = $('#startDate').val(),
      //endDate  = $('#endDate').val(),
      //filename = ['Trends', keys.join('&'), startDate, endDate].join('_') + '.' + ext;
	filename = ['Timeline', keys.join('&'), ].join('_') + '.' + ext;
	return filename;
}



//clear the data function
function clearData() {
  chartData.length = 0;
  updateChart();
}

function resizeSigma(c)
{
	$("#zoom-in").show();
	$("#zoom-out").show();

	// Zoom out - single frame :
	$("#zoom-out").bind("click",function(){
		c.goTo({
			ratio: c.ratio * c.settings('zoomingRatio')
		});
	});

	// Zoom in - single frame :
	$("#zoom-in").bind("click",function(){
		c.goTo({
			ratio: c.ratio / c.settings('zoomingRatio')
		});
	});

	// Zoom out - animation :
	sigma.misc.animation.camera(c, {
	  ratio: c.ratio * c.settings('zoomingRatio')
	}, {
	  duration: 200
	});

	// Zoom in - animation :
	sigma.misc.animation.camera(c, {
	  ratio: c.ratio / c.settings('zoomingRatio')
	}, {
	  duration: 200
	});
}

var TWEET_URL = "https://twitter.com/%0/status/%1";

function GenerateUserModal(e)
{
	var node = e.data.node.data;

	//new incoming edges, could be is_mentioned_by, has_quoted, has_retweeted
	var is_mentioned_by = {}, has_quoted = {}, has_retweeted = {};
	for (var i in node.incoming)
	{
		var fromURL = 'https://twitter.com/intent/user?user_id='+i,
			toURL = 'https://twitter.com/intent/user?user_id='+e.data.node.id;

		for (var j in node.incoming[i].ids)
		{
			var tweetURL = TWEET_URL.replace("%0", i).replace("%1", node.incoming[i].ids[j]);
			//console.log("tweetURL:\t" + tweetURL);

			//console.log("incoming edge tweet type:\t" + node.incoming[i].tweet_types[j]);

			//console.log("incoming.is_mention:\t" + node.incoming[i].is_mentions[j]);
			if (true != node.incoming[i].is_mentions[j] && false != node.incoming[i].is_mentions[j])
				console.log("GenerateUserModal Parse incoming.is_mentions error!!");

			//if is_mention == true, then must be a mention
			// if(true == node.incoming[i].is_mentions[j])
			//if is_mention == true, or "reply"==tweet type, then must be a mention,
			if(true == node.incoming[i].is_mentions[j] || "reply" == node.incoming[i].tweet_types[j])
			{
				is_mentioned_by[i] = is_mentioned_by[i] || {user_url: fromURL, screenName: node.incoming[i].screenName, article_titles: [], tweet_urls: [], article_urls: []};
				is_mentioned_by[i].article_titles.push(node.incoming[i].titles[j]);
				is_mentioned_by[i].tweet_urls.push(tweetURL);
				is_mentioned_by[i].article_urls.push(node.incoming[i].url_raws[j]);
				continue;
			}

			//else if is_mention = false, switch according to tweet_types
			if ("quote" == node.incoming[i].tweet_types[j])
			{
				has_quoted[i] = has_quoted[i] || {user_url: fromURL, screenName: node.incoming[i].screenName, article_titles: [], tweet_urls: [], article_urls: []};
				has_quoted[i].article_titles.push(node.incoming[i].titles[j]);
				has_quoted[i].tweet_urls.push(tweetURL);
				has_quoted[i].article_urls.push(node.incoming[i].url_raws[j]);
			}
			else if("retweet" == node.incoming[i].tweet_types[j])
			{
				has_retweeted[i] = has_retweeted[i] || {user_url: fromURL, screenName: node.incoming[i].screenName, article_titles: [], tweet_urls: [], article_urls: []};
				has_retweeted[i].article_titles.push(node.incoming[i].titles[j]);
				has_retweeted[i].tweet_urls.push(tweetURL);
				has_retweeted[i].article_urls.push(node.incoming[i].url_raws[j]);
			}

		}
	}

	//has_quoted
	if (0 != Object.keys(has_quoted).length)
	{
		$('#myModalBody').append('<h2>has quoted:</h2>');
		for (var user in has_quoted)
		{
			$('#myModalBody').append('<h3>User:  <a target="_blank" href="'+ has_quoted[user].user_url +'">'+ has_quoted[user].screenName + '</h3>');

			for (var j in has_quoted[user].article_titles)//every mention of the user
			{
					//article title
					$("#myModalBody").append("<div class='article_headline'>" + has_quoted[user].article_titles[j] + "</div>");
					//see tweet, see article
					$("#myModalBody").append('<div class="modal_links">See <a target="_blank" href="'+ has_quoted[user].tweet_urls[j] + '">tweet</a>' +
					' or  <a target="_blank" href="'+ has_quoted[user].article_urls[j]+ '">article</a></div>');
			}
		}
	}
	else
		$('#myModalBody').append('<h2>has quoted: nobody</h2>');
		// $('#myModalBody').append('<h2>has quoted: Nobody</h2>');

	//is_mentioned_by
	if (0 != Object.keys(is_mentioned_by).length)
	{
		$('#myModalBody').append('<h2>was mentioned by:</h2>');

		// $('#myModalBody').append('<h2>is mentioned by</h2>');
		for (var user in is_mentioned_by)
		{
			$('#myModalBody').append('<h3>User:  <a target="_blank" href="'+is_mentioned_by[user].user_url +'">'+ is_mentioned_by[user].screenName + '</h3>');

			for (var j in is_mentioned_by[user].article_titles)//every mention of the user
			{
					//article title
					$("#myModalBody").append("<div class='article_headline'>" + is_mentioned_by[user].article_titles[j] + "</div>");
					//see tweet, see article
					$("#myModalBody").append('<div class="modal_links">See <a target="_blank" href="'+ is_mentioned_by[user].tweet_urls[j] + '">tweet</a>' +
					' or  <a target="_blank" href="'+ is_mentioned_by[user].article_urls[j]+ '">article</a></div>');
			}
		}
	}
	else
		$('#myModalBody').append('<h2>was mentioned by: nobody</h2>');
		// $('#myModalBody').append('<h2>is mentioned by Nobody</h2>');

	//has_retweeted
	if (0 != Object.keys(has_retweeted).length)
	{
		$('#myModalBody').append('<h2>has retweeted: </h2>');
		for (var user in has_retweeted)
		{
			$('#myModalBody').append('<h3>User:  <a target="_blank" href="' + has_retweeted[user].user_url +'">'+ has_retweeted[user].screenName + '</h3>');

			for (var j in has_retweeted[user].article_titles)//every mention of the user
			{
					//article title
					$("#myModalBody").append("<div class='article_headline'>" + has_retweeted[user].article_titles[j] + "</div>");
					//see tweet, see article
					$("#myModalBody").append('<div class="modal_links">See <a target="_blank" href="'+ has_retweeted[user].tweet_urls[j] + '">tweet</a>' +
					' or  <a target="_blank" href="'+ has_retweeted[user].article_urls[j]+ '">article</a></div>');
			}
		}
	}
	else
		$('#myModalBody').append('<h2>has retweeted: nobody</h2>');



		// $('#myModalBody').append('<h2>has retweeted: Nobody</h2>');

	//new outgoing edges, could be has_mentioned, is_quoted_by, is_retweeted_by
	var has_mentioned = {}, is_quoted_by = {}, is_retweeted_by = {};
	for (var i in node.outgoing)
	{
		var fromURL = 'https://twitter.com/intent/user?user_id='+e.data.node.id,
			toURL = 'https://twitter.com/intent/user?user_id='+i;

		for (var j in node.outgoing[i].ids)
		{
			var tweetURL = TWEET_URL.replace("%0", i).replace("%1", node.outgoing[i].ids[j]);
			//console.log("outgoing edge tweet type:\t" + node.outgoing[i].tweet_types[j]);

			//console.log("outgoing.is_mention:\t" + node.outgoing[i].is_mentions[j]);
			if (true != node.outgoing[i].is_mentions[j] && false != node.outgoing[i].is_mentions[j])
				console.log("GenerateUserModal Parse outgoing.is_mentions error!!");

			//if is_mention == true, then must be a mention
			// if(true == node.outgoing[i].is_mentions[j])
			//if is_mention == true, or "reply"==tweet type, then must be a mention
			if(true == node.outgoing[i].is_mentions[j] || "reply" == node.outgoing[i].tweet_types[j])
			{
				has_mentioned[i] = has_mentioned[i] || {user_url: toURL, screenName: node.outgoing[i].screenName, article_titles: [], tweet_urls: [], article_urls: []};
				has_mentioned[i].article_titles.push(node.outgoing[i].titles[j]);
				has_mentioned[i].tweet_urls.push(tweetURL);
				has_mentioned[i].article_urls.push(node.outgoing[i].url_raws[j]);
				continue;
			}

			//else if is_mention = false, switch according to tweet_types
			if ("quote" == node.outgoing[i].tweet_types[j])
			{
				is_quoted_by[i] = is_quoted_by[i] || {user_url: toURL, screenName: node.outgoing[i].screenName, article_titles: [], tweet_urls: [], article_urls: []};
				is_quoted_by[i].article_titles.push(node.outgoing[i].titles[j]);
				is_quoted_by[i].tweet_urls.push(tweetURL);
				is_quoted_by[i].article_urls.push(node.outgoing[i].url_raws[j]);
			}
			else if("retweet" == node.outgoing[i].tweet_types[j])
			{
				is_retweeted_by[i] = is_retweeted_by[i] || {user_url: toURL, screenName: node.outgoing[i].screenName, article_titles: [], tweet_urls: [], article_urls: []};
				is_retweeted_by[i].article_titles.push(node.outgoing[i].titles[j]);
				is_retweeted_by[i].tweet_urls.push(tweetURL);
				is_retweeted_by[i].article_urls.push(node.outgoing[i].url_raws[j]);
			}
		}
	}

	//has_mentioned
	if (0 != Object.keys(has_mentioned).length)
	{
		$('#myModalBody').append('<h2>has mentioned: </h2>');
		for (var user in has_mentioned)
		{
			$('#myModalBody').append('<h3>User:  <a target="_blank" href="' + has_mentioned[user].user_url +'">'+ has_mentioned[user].screenName + '</h3>');

			for (var j in has_mentioned[user].article_titles)//every mention of the user
			{
					//article title
					$("#myModalBody").append("<div class='article_headline'>" + has_mentioned[user].article_titles[j] + "</div>");
					//see tweet, see article
					$("#myModalBody").append('<div class="modal_links">See <a target="_blank" href="'+ has_mentioned[user].tweet_urls[j] + '">tweet</a>' +
					' or  <a target="_blank" href="'+ has_mentioned[user].article_urls[j]+ '">article</a></div>');
			}
		}
	}
	else
		$('#myModalBody').append('<h2>has mentioned: nobody</h2>');
	//is_quoted_by
	if (0 != Object.keys(is_quoted_by).length)
	{
		$('#myModalBody').append('<h2>was quoted by: </h2>');
		for (var user in is_quoted_by)
		{
			$('#myModalBody').append('<h3>User:  <a target="_blank" href="'+is_quoted_by[user].user_url +'">'+ is_quoted_by[user].screenName + '</h3>');

			for (var j in is_quoted_by[user].article_titles)//every mention of the user
			{
					//article title
					$("#myModalBody").append("<div class='article_headline'>" + is_quoted_by[user].article_titles[j] + "</div>");
					//see tweet, see article
					$("#myModalBody").append('<div class="modal_links">See <a target="_blank" href="'+ is_quoted_by[user].tweet_urls[j] + '">tweet</a>' +
					' or  <a target="_blank" href="'+ is_quoted_by[user].article_urls[j]+ '">article</a></div>');
			}
		}
	}
	else
		$('#myModalBody').append('<h2>was quoted by: nobody</h2>');
		// $('#myModalBody').append('<h2>is quoted by: Nobody</h2>');


	//is_retweeted_by
	if (0 != Object.keys(is_retweeted_by).length)
	{
		$('#myModalBody').append('<h2>was retweeted by: </h2>');
		// $('#myModalBody').append('<h2>is retweeted by </h2>');
		for (var user in is_retweeted_by)
		{
			$('#myModalBody').append('<h3>User:  <a target="_blank" href="'+is_retweeted_by[user].user_url +'">'+ is_retweeted_by[user].screenName + '</h3>');

			for (var j in is_retweeted_by[user].article_titles)//every mention of the user
			{
					//article title
					$("#myModalBody").append("<div class='article_headline'>" + is_retweeted_by[user].article_titles[j] + "</div>");
					//see tweet, see article
					$("#myModalBody").append('<div class="modal_links">See <a target="_blank" href="'+ is_retweeted_by[user].tweet_urls[j] + '">tweet</a>' +
					' or  <a target="_blank" href="'+ is_retweeted_by[user].article_urls[j]+ '">article</a></div>');
			}
		}
	}
	else
		$('#myModalBody').append('<h2>was retweeted by: nobody</h2>');



}

function drawGraph(graph) {

	if(s)
	{
		// console.debug("killing: ", s);
		// s.graph.clear();
		// s.graph.kill();
		s.kill();
		s = null;
		console.debug("Killed Existing Sigma");
	}

	console.log("Drawing Sigma");
	$('#graph-container').empty();

	s = new sigma({
		graph:graph,
        container: 'graph-container',
        renderer: {
            // IMPORTANT:
            // This works only with the canvas renderer, so the
            // renderer type set as "canvas" is necessary here.
            container: document.getElementById('graph-container'),
            type: 'canvas'
        },
        settings: {
            //autoRescale: false,
			autoRescale: true,
			scalingMode: "inside",
            //zoomMin: 1,
            //zoomMax: 500,
            //zoomRatio: 10,
            edgeHoverExtremities: true,
            borderSize: 2,
            minArrowSize: 6,
            //defaultNodeBorderColor: this.colors.over.node,
            //defaultEdgeHoverColor: this.colors.over.node,
            labelThreshold: 8,
            enableEdgeHovering: true,
            edgeHoverSizeRatio: 2,
            singleHover: true,

			rescaleIgnoreSize: true
        }
    });

	var jiggle_compensator = Math.floor(Math.sqrt(graph.edges.length)) *600;
	// console.debug(graph.edges.length);
	// console.debug(jiggle_compensator);

	s.refresh({skipIndexation: true});
	//s.rescale();
	s.startForceAtlas2({
        slowDown: 100,
        gravity: 2
    });
	setTimeout(function () {
		s.stopForceAtlas2();
		// console.debug(s.camera);
		s.camera.goTo({x:0, y:0, ratio:1});
		//c.goTo({
		// 	ratio: c.ratio * c.settings('zoomingRatio')
		// });
		// s.position(0,0,1).draw();
		// s.middlewares.rescale();

		// s.refresh({skipIndexation: true});
		spinStop();
	}, 2000 + jiggle_compensator);
    s.bind('clickNode', function (e) {
		var node = e.data.node.data;


        //the following /**/ is for twitter user widget.
		$('#myModalLabel').html('User:  <a target="_blank" href="https://twitter.com/intent/user?user_id='+e.data.node.id+'">@'+ node.screenName +'</a>');

		$("#myModalBody").html('');
		$("#myModalBody").empty();
		//insert tweets into modal body, grouped by individual to_user_id
		GenerateUserModal(e);
		$("#myModal").off('shown.bs.modal show.bs.modal');
		$("#myModal").on("shown.bs.modal show.bs.modal", function(){
			$(".modal-dialog").scrollTop(0);
		});
		// console.debug($("#myModal"));
		$('#myModal').modal('toggle');

		// $("#myModal, #myModal div").each(function(){ console.debug($(this).scrollTop()); });
		//the following is for open mini profile in a new window, instead of a tab
		/*var url = "https://twitter.com/intent/user?screen_name=" + e.data.node.label;
		console.log('intent url:\t' + url);
		window.open(url, '_blank', 'width=300,height=200');*/

    });

	s.bind('clickEdge', function(e){

		//TO DO
		var edge = e.data.edge;

		$('#myModalBody').html('');
		//console.log('length:\t' + edge.ids.length);
		var tweet_types_hashtable = {"mention": 0, "quote": 0, "retweet": 0};
		for (var i =0; i < edge.outgoing_ids.length; ++i)
		{
			//console.log(edge.tweet_types[i]);
			var type = edge.tweet_types[i];
			(type == "reply") ? type = "mention" : type;
			(type == "origin") ? type = "mention" : type;


			++tweet_types_hashtable[type];
			//title(plain text)
			$("#myModalBody").append(edge.titles[i]);
			//see tweet, see article
			var tweetURL = TWEET_URL.replace("%0", edge.target).replace("%1", edge.outgoing_ids[i]);
			$("#myModalBody").append('<div class="modal_links">See <a target="_blank" href="'+ tweetURL + '">tweet</a>' +
			' or  <a target="_blank" href="'+ edge.url_raws[i]+ '">article</a></div>');
		}

		//show modal header, like  User A mentions, quotes, and labels B
		var modal_string = '<a target="_blank" href="https://twitter.com/intent/user?user_id='+ edge.source + '">@' + edge.source_screenName +'</a> ';
		var elemNum = 0;
		for (var key in tweet_types_hashtable)
			if (tweet_types_hashtable.hasOwnProperty(key) && tweet_types_hashtable[key] > 0)
			{
				(0 == elemNum++) ? (modal_string += " ") : (modal_string += ", ");
				if("mention" == key)
					modal_string += "mentioned";
				else if ("retweet" == key)
					modal_string += "was retweeted by";
				else if ("quote" == key)
					modal_string += "was quoted by";
			}

		modal_string += ' <a target="_blank" href="https://twitter.com/intent/user?user_id='+ edge.target + '">@' + edge.target_screenName +'</a> ';

		$('#myModalLabel').html(modal_string);



		$("#myModal").off('shown.bs.modal show.bs.modal');
		$("#myModal").on("shown.bs.modal show.bs.modal", function(){
			$(".modal-dialog").scrollTop(0);
		});

		$('#myModal').modal('toggle');

	});

	resizeSigma(s.camera);

	window.scroll(0,$("#graphs").offset().top);


}

// }

 // ######  #######    #    ######  #     #
 // #     # #         # #   #     #  #   #
 // #     # #        #   #  #     #   # #
 // ######  #####   #     # #     #    #
 // #   #   #       ####### #     #    #
 // #    #  #       #     # #     #    #
 // #     # ####### #     # ######     #


$(document).ready(function () {

	var color_styles = "";
	color_styles += "\n#article_list li.fact_checking label input:checked + .fa + .fa + div div { color: white; background: " + colors.edge_colors.fact_checking_dark + "; }";
	color_styles += "\n#article_list li.fact_checking label input:checked + .fa + .fa + div { color: white; background: " + colors.edge_colors.fact_checking_dark + "; }";
	color_styles += "\n#article_list li.fact_checking label input:checked + .fa + .fa + div a { color: white; background: " + colors.edge_colors.fact_checking_dark + "; }";
	color_styles += "\n#article_list li.claim label input:checked + .fa + .fa + div div { color: white; background: " + colors.edge_colors.claim_dark + "; }";
	color_styles += "\n#article_list li.claim label input:checked + .fa + .fa + div { color: white; background: " + colors.edge_colors.claim_dark + "; }";
	color_styles += "\n#article_list li.claim label input:checked + .fa + .fa + div a { color: white; background: " + colors.edge_colors.claim_dark + "; }";
	color_styles += "\n#article_list li.fact_checking label div { color: white; background: " + colors.edge_colors.fact_checking + "; }";
	color_styles += "\n#article_list li.claim label div { color:white; background: " + colors.edge_colors.claim + "; }";
	color_styles += "\n.fact_checking_label{ color: white; background: " + colors.edge_colors.fact_checking + "; }";
	color_styles += "\n.claim_label { color:white; background: " + colors.edge_colors.claim + "; }";

	$("#colors").html(color_styles);

    chart = nv.models.lineWithFocusChart()
		.showLegend(false)
        .useInteractiveGuideline(true);

	chart.margin({right: 50, bottom: 50});

	chart.xAxis
		.tickFormat(dateFormatter);
	chart.x2Axis
		.tickFormat(dateFormatter);
	chart.forceY([0])
	chart.yAxis.axisLabel("Tweets");

   //color changing
   //chart.color(nv.utils.getColor(d3.scale.category10().range()));
	chart.color([colors.edge_colors.claim, colors.edge_colors.fact_checking]); //color match with those of nodes

	// var edges;


	//  #####                                   #####
	// #     # #    # #####  #    # # #####    #     # #      #  ####  #    #
	// #       #    # #    # ##  ## #   #      #       #      # #    # #   #
	//  #####  #    # #####  # ## # #   #      #       #      # #      ####
	//       # #    # #    # #    # #   #      #       #      # #      #  #
	// #     # #    # #    # #    # #   #      #     # #      # #    # #   #
	//  #####   ####  #####  #    # #   #       #####  ###### #  ####  #    #

	function makeArticleItem(url)
	{

		var string_element = "";
		var element_class = url.site_type;
		if(element_class !== "fact_checking")
		element_class = "claim";

		string_element += '<li class="' + element_class + '">';
		string_element += '	<label>';
		string_element += '		<input type="checkbox" id="' + url.url_id + '" value="' + url.url_id + '" /><i class="fa fa-square-o" aria-hidden="true"></i><i class="fa fa-check-square-o" aria-hidden="true"></i>';
		string_element += '		<div class="rounded">';

		// if(url.site_type == "claim")
		// {
		// 	string_element += '<span title="Claim" class="icon"><i class="fa fa-bullhorn" aria-hidden="true"></i></span>';
		// }
		// else if (url.site_type == "fact_checking")
		// {
		// 	string_element += '<span title="Fact Checking" class="icon"><i class="fa fa-check-square-o" aria-hidden="true"></i></span>';
		//
		// }

		var pub_date = new Date(url.pub_date);
		var dateline = $.datepicker.formatDate('M d, yy', pub_date);
		var id = Math.floor(Math.random() * 100000);
		// console.debug(id);
		// console.debug(url);
		string_element += '			<span class="article_title"><a href="' + url.url_raw + '" target="_blank">' + url.title + '</a></span>';
		string_element += '			<div class="col-lg-6 col-md-7 col-xs-12"><span class="article_domain">via <a href="http://' + url.site_domain + '" target="_blank">' + url.site_domain + '</a></span>';
		string_element += '			<span class="article_date">am ' + dateline + '</span></div>';
		string_element += '			<div class="text-md-right col-lg-6 col-md-5 col-xs-12 article_stats"><span><b>' + url.number_of_tweets + '</b> Tweets</span>';
		string_element += '				<br class="hidden-lg-up" /><span id="facebook_count_'+id+'"></span></div>';
		string_element += '		<div class="clearfix"></div>';
		string_element += '		</div>';
		string_element += '	</label>';
		string_element += '</li>';

		var f = function (id){
			FB.api('/', {"id": url.url_raw}, function(response) {
				//   console.log(response);
				var i = id;
				// console.debug(i, response);
				if(!response.error)
				{
					try {
						$("#facebook_count_" + i).html("<b>" + response.share.share_count + "</b> Facebook Shares");
					}catch(e){
						// $("#facebook_count_" + i).html("<b>Unknown</b> Facebook Shares");
						// console.debug(e);
					}
				}

			});
		}(id);

		return string_element;
	}
	var max_articles = 20;
	var articles_loaded = 0;
	var all_urls = null;
	dontScroll = false;

	function addArticles(){
		var starting_index = articles_loaded;
		for(var i = starting_index, x = all_urls.length; i < (max_articles + starting_index) && i < x; i++ )
		{
			var url = all_urls[i];

			var string_element = makeArticleItem(url);

			$("#article_list").append(string_element);
			articles_loaded ++;
		}
		// console.debug(articles_loaded);
		if(articles_loaded >= 100)
		{
			$("#load_more .text-muted").html("Your query has found too many matches for us to load. Please narrow down your query and try again to get more articles.");
			$("#load_more button").addClass("disabled").prop("disabled", true);
		}
		else if(articles_loaded >= all_urls.length && all_urls.length < 100)
		{
			$("#load_more .text-muted").html("We couldn't find any more articles for this query.");
			$("#load_more button").addClass("disabled").prop("disabled", true);
		}
		else
		{
			$("#load_more .text-muted").empty();
			$("#load_more button").removeClass("disabled").prop("disabled", false);
		}
	}

	$("#load_more button").on("click", function(){
		addArticles();

		original_bottom = $("#visualize").offset().top;
	});

    $("#form form").submit(function (e) {

		articles_loaded = 0;

		e.preventDefault();
		e.stopPropagation();

		disableInput();
		spinStart();
		$("#articles, #graphs").hide();
		$("#select_all").prop("checked", false);

		if(!$("#query").val())
		{
			alert("You must input a claim.");
			spinStop();
			spinStop();
			spinStop();
			enableInput();
			return false;
		}
		//URLS
		var urls_paras = GetURLsParas();
		changeURLParams();

		var urls_request = $.ajax({
			url: "https://api-hoaxy.p.mashape.com/articles",
            headers: {

                "X-Mashape-Key": "9Yb8Uc7PXymsh3VWkZ9QJutASutTp1lB7s5jsnfo9jtToamB2d",
                "X-Mashape-Proxy-Secret": "3pAI3EjyGS7v05FiL1dzZp7Rb4mQ0rHDGSPxQLeYEok4jPJpq1",
                "Accept": "application/json"
            },
            data: urls_paras,
            dataType: "json",
		});
		urls_request.done(function (msg) {
			// console.debug(msg);
			var urls_model = msg;

			if(!msg.articles || !msg.articles.length)
			{
				alert("Your query did not return any results.");
				return false;
			}

			urls_model.urls = msg.articles.map(function(x){
				y = x;
				y.site_domain = x.domain;
				y.url_id = x.id;
				y.pub_date = x.date_published;
				y.url_raw = x.canonical_url;
				return y;
			});
			// console.debug(urls_model);
			all_urls = null;
			all_urls = urls_model.urls;

			$("#article_list").empty();
			// console.log(urls_model.urls);
			// for( var i in urls_model.urls)


			addArticles();


            // track query event with Google Analytics
            var query_string = $('#query').val();
            ga('send', 'event', 'query', query_string);

			$("#articles").show();
			var visualize_top = $("#visualize_top");
			var visualize_bottom = $("#visualize");
			original_bottom = visualize_bottom.offset().top;
			var original_top = visualize_top.offset().top;
			var original_left = visualize_top.offset().left;
			var header_height = $("nav.navbar").outerHeight();
			// console.debug(original_top);
			// console.debug(header_height);
			$(window).on('scroll', function(){
				var issticky =
					($(window).scrollTop() + (header_height + 15)) > (original_top)
					&&
					($(window).scrollTop() + (header_height + 15)) < (original_bottom)
					;

				console.debug(original_bottom);
				if(issticky)
				{
					visualize_top.addClass("visualize_sticky");
					visualize_top.css("left", original_left + "px");
					visualize_top.css("top", (header_height) + "px");
				}
				else
				{
					visualize_top.removeClass("visualize_sticky");
					visualize_top.css("left", "auto");
					visualize_top.css("top", "auto");
				}
			});
			// console.debug(dontScroll);
			if(!dontScroll)
			{
				window.scroll(0,$("#articles").offset().top);
			}
			else
			{
				dontScroll = false;
			}

			//var post_text = 'Hoaxy: ' + $("#query").val();
			//$('meta[property="og:title"]').replaceWith('<meta property="og:title" content="'+ post_text +'">');
			var facebook_share_url = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(location.href) + "&amp;src=sdkpreparse"
			$("#fb-button").empty();
			var new_button = "";
			new_button += '<span class="fb-share-button" data-href="'+ (location.href)+'" data-layout="button" data-size="large" data-mobile-iframe="true">';
			new_button += '	<a class="fb-xfbml-parse-ignore" target="_blank"';
			new_button += '	href="' + facebook_share_url + '">Share</a>';
			new_button += '</span>';
			$("#fb-button").append(new_button);
			try{
		        FB.XFBML.parse();
		    }catch(ex){}

			$("#twitter-button").empty();
			var t_button = "";
			t_button += '<a class="twitter-share-button"';
			t_button += 'href="https://twitter.com/share"';
			t_button += 'data-text="Hoaxy: Visualize the spread of claims about \'' + $("#query").val() + '\'"';
			t_button += 'data-via="TruthyAtIndiana"';
			t_button += 'data-related="TruthyBotOrNot,OSoMe_bot"';
			t_button += 'data-size="large">';
			t_button += 'Tweet</a>';
			$("#twitter-button").append(t_button);

			try{
				twttr.widgets.load();
			} catch (e) {

			}

			// enableInput();
			// spinStop(true);
		});
		urls_request.fail(function (jqXHR, textStatus) {
            alert("Get URLs Request failed: " + textStatus);
			console.log('ERROR', textStatus);
			// enableInput();
			// spinStop(true);
        });
		urls_request.complete(function(){
			spinStop(true);
			enableInput();
		});



	});


 // #     #                                                   #####
 // #     # #  ####  #    #   ##   #      # ###### ######    #     # #      #  ####  #    #
 // #     # # #      #    #  #  #  #      #     #  #         #       #      # #    # #   #
 // #     # #  ####  #    # #    # #      #    #   #####     #       #      # #      ####
 //  #   #  #      # #    # ###### #      #   #    #         #       #      # #      #  #
 //   # #   # #    # #    # #    # #      #  #     #         #     # #      # #    # #   #
 //    #    #  ####   ####  #    # ###### # ###### ######     #####  ###### #  ####  #    #



	$("#visualize, #visualize_top").on("click", function(event){
		spinStart();
		//Timeline
		var url_ids = [];
		$("#graphs").hide();

		if(s)
		{
			s.kill();
			s = null;
			console.debug("Killed Existing Sigma");
		}

		var checked = $("#article_list input:checked");

		if(checked.length > 20)
		{
			alert("You can visualize a maximum of 20 articles.");
			event.preventDefault();
			event.stopPropagation();
			spinStop(true);
			return false;
		}
		var counter = 0;
		checked.each(function(){
			var val = $(this).val();
			url_ids.push(val * 1);
			// console.log(val);
			counter ++;

		});

        // track comma-separated list of IDS with Google Analytics
        ga('send', 'event', 'url_ids', url_ids.join(','));

		//  console.log(url_ids);

		var timeline_paras = GetTimeLineParas(url_ids);

		// console.debug(timeline_paras.url_ids.length);
		if(counter <= 0)
		{
			alert("Select at least one article to visualize.");
			spinStop();
			spinStop();
			spinStop();
			enableInput();
			return false;
		}

		// var timeline_paras = GetTimeLineParas([1396760, 1426814, 1404329,1415721]);
		var timeline_request = $.ajax({
			url: "https://api-hoaxy.p.mashape.com/timeline",
            headers: {

                "X-Mashape-Key": "9Yb8Uc7PXymsh3VWkZ9QJutASutTp1lB7s5jsnfo9jtToamB2d",
                "X-Mashape-Proxy-Secret": "3pAI3EjyGS7v05FiL1dzZp7Rb4mQ0rHDGSPxQLeYEok4jPJpq1",
                "Accept": "application/json"
            },
            data: timeline_paras,
            dataType: "json",
		});
		timeline_request.done(function (msg) {
			console.debug(msg);


			//nvd3 charts
			$("#graphs").show();
            retrieveTimeSeriesData(msg.timeline);
			// console.log("TIMELINE: ");
			// console.log(msg.timeline);

			window.scroll(0,$("#graphs").offset().top);
        });
		timeline_request.fail(function (jqXHR, textStatus) {
            alert("Get TimeLine Request failed: " + textStatus);
			console.log('ERROR', textStatus);
        });
		timeline_request.complete(function(){
			spinStop();
		})

		//Network
		var paras = GetNetworkParas(url_ids); //p is json object
		// var paras = GetNetworkParas([1396760, 1426814, 1404329,1415721]); //p is json object
        var graph_request = $.ajax({
            //type: "GET",
            url: "https://api-hoaxy.p.mashape.com/network",
            headers: {
                "X-Mashape-Key": "9Yb8Uc7PXymsh3VWkZ9QJutASutTp1lB7s5jsnfo9jtToamB2d",
                "X-Mashape-Proxy-Secret": "3pAI3EjyGS7v05FiL1dzZp7Rb4mQ0rHDGSPxQLeYEok4jPJpq1",
                "Accept": "application/json"
            },
            data: paras,
            dataType: "json",
        });

        graph_request.done(function (msg){
			$("#graph_error").remove();
            if(msg.error)
            {
				edges = null;
				$("#zoom-in").hide();
				$("#zoom-out").hide();
                console.debug("Not enough data.  Could not create graph.");
				$("#graph-container").prepend("<div id='graph_error'>There was not enough data to generate a network graph.  Try selecting more popular articles to visualize.</div>");
                spinStop();
				return false;
            }

			edges = msg.edges.map(function(x){
				y = x;
				y.site_domain = x.domain;
				//y.url_id = x.id;
				y.pub_date = x.date_published;
				y.url_raw = x.canonical_url;
				return y;
			});

			console.debug("Got Edges");


			//Don't generate by itself... wait for the timeline to draw the graph.
			// $("#graphs").show();
			// console.debug("current s:", s)
			// if(!s)
			// {
			// 	console.debug("Drawing from edge got");
			// 	graph = Graph(edges, 0, (new Date()).getTime());
			// 	drawGraph(graph);
			// }
		});

        graph_request.fail(function (jqXHR, textStatus) {
            alert("Get Graph Request failed: " + textStatus);
			console.log('ERROR', textStatus);
			spinStop();
        });
		graph_request.complete(function(){
			enableInput();
		})
	});



 // #######
 // #     # #    # #       ####    ##   #####
 // #     # ##   # #      #    #  #  #  #    #
 // #     # # #  # #      #    # #    # #    #
 // #     # #  # # #      #    # ###### #    #
 // #     # #   ## #      #    # #    # #    #
 // ####### #    # ######  ####  #    # #####


	spinStop();

	$("#suggestions a").on("click", function(){
		populateQuery($(this).html());
		return false;
	})
	$("#articles, #graphs").hide();
	loadURLParams();


	var select_all = $("#select_all");
	select_all.on("click", function(e){
			var boxes = $("#article_list input");
			for(var i = 0; i < 20; i++)
			{
				$(boxes[i]).prop("checked", select_all.prop("checked"));
			}
			check_for_pulse();
	});

	$("#article_list").on("click", "input", function(){
		check_for_pulse();

		if(!$(this).prop("checked"))
		{
			// $("#visualize_top").removeClass("pulse");
			select_all.prop("checked", false);
		}
		else
		{
			// $("#visualize_top").addClass("pulse");
		}
	});

	function check_for_pulse(){
		var checked = 0;
		$("#article_list input").each(function(){
			if($(this).prop("checked"))
				checked ++;
		})
		console.debug(checked);
		if(checked <= 0)
		{
			$("#visualize_top").removeClass("pulse");
		}
		else
		{
			$("#visualize_top").addClass("pulse");
		}
	};
});

var spin_timer = null;

var spin_counter = 0;
function spinStop(reset){
	spin_counter --;
	if(reset === true)
	{
		spin_counter = 0;
	}

	if(spin_counter <= 0)
	{
		spinner = undefined;
		$("#spinner").hide();
		clearTimeout(spin_timer);
		spin_timer = null;
	}
	// console.debug(spin_counter);

}
function spinStart(){
	spin_counter = 2;
	$("#spinner").show();
	var target = document.getElementById('spinner');
	spinner = new Spinner(opts).spin(target);
	//timeout after 20 seconds so we're not stuck in an endless spinning loop.
	if(spin_timer)
	{
		clearTimeout(spin_timer);
		spin_timer = null;
	}
	spin_timer = setTimeout(function(){
		alert("Hoaxy is taking too long to respond.  Please try again later.");
		spinStop(true);
		enableInput();
	}, 90000);
	// console.debug(spin_counter);
}


function populateQuery(query)
{
	$("#query").val(query);
}
