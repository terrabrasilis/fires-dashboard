var graph={
		
	jsonData:[],
	totalRows:0,
	alerts:{},
	config:{},
	selectedFilters:{},
	ctlFirstLoading:false,
	cssDefault:true,
	
	totalizedAreaInfoBox:undefined,// totalized area info box
	totalizedAlertsInfoBox:undefined,// totalized alerts info box
	lineDistributionByMonth:undefined,
	//ringTotalizedByClass:undefined,
	histTopByCounties:undefined,
	ringTotalizedByState:undefined,
	histTopByCLs:undefined,
	
	histogramColor: ["#0000FF","#57B4F0"],
	darkHistogramColor: ["#ffd700","#fc9700"],
	pallet: ["#FF0000","#FF6A00","#FF8C00","#FFA500","#FFD700","#FFFF00","#DA70D6","#BA55D3","#7B68EE"],
	darkPallet: ["#FF0000","#FF6A00","#FF8C00","#FFA500","#FFD700","#FFFF00","#DA70D6","#BA55D3","#7B68EE"],
	barTop10Color: "#b8b8b8",
	darkBarTop10Color: "#232323",

	/**
	 * Load configuration file before loading data.
	 */
	setConfigurations: function(conf) {
		if(conf) {
			graph.pallet=conf.pallet?conf.pallet:graph.pallet;
			graph.darkPallet=conf.darkPallet?conf.darkPallet:graph.darkPallet;
			graph.histogramColor=conf.histogramColor?conf.histogramColor:graph.histogramColor;
			graph.darkHistogramColor=conf.darkHistogramColor?conf.darkHistogramColor:graph.darkHistogramColor;
			graph.barTop10Color=conf.barTop10Color?conf.barTop10Color:graph.barTop10Color;
			graph.darkBarTop10Color=conf.darkBarTop10Color?conf.darkBarTop10Color:graph.darkBarTop10Color;
			graph.defaultHeight=conf.defaultHeight?conf.defaultHeight:graph.utils.getDefaultHeight();
		}else{
			console.log("Didn't load config file. Using default options.");
		}
	},

	init:function(config, data) {

		if(data.length==0 || data.exception!==undefined) {
			this.displayWarning(true);
			return;
		}
		
		Lang.apply();
		
		graph.setConfigurations(config.dataConfig);
		//graph.utils.dataConfig=config.dataConfig;

		if(this.loadData(false, data)) {
			
			this.displayWaiting(false);
			this.config=config;
			
			//this.config.defaultHeight = graph.utils.getDefaultHeight();
			this.totalizedAlertsInfoBox = dc.numberDisplay("#numpolygons");
			// this.totalizedAreaInfoBox = dc.numberDisplay("#custom-classes");

			this.lineDistributionByMonth = dc.barChart("#chart-line-by-month");
			//this.ringTotalizedByClass = dc.pieChart("#chart-ring-by-class");
			this.histTopByCounties = dc.rowChart("#chart-hist-top-counties");
			this.ringTotalizedByState = dc.pieChart("#chart-ring-by-state");
			this.histTopByCLs = dc.rowChart("#chart-hist-top-ucs");
			
			graph.build();
			SearchEngine.init(this.histTopByCounties, this.ringTotalizedByState ,'modal-search');
			graph.loadUpdatedDate();
		}
	},
	
	displayWaiting: function(enable) {
		if(enable===undefined) enable=true;
		d3.select('#charts-panel').style('display',((enable)?('none'):('')));
		d3.select('#loading_data_info').style('display',((!enable)?('none'):('')));
		d3.select('#info_container').style('display',((!enable)?('none'):('')));
		d3.select('#panel_container').style('display',((enable)?('none'):('')));
		d3.select('#warning_data_info').style('display','none');
		d3.select('#radio-area').style('display',((enable)?('none'):('')));
		d3.select('#radio-alerts').style('display',((enable)?('none'):('')));
	},
	
	displayWarning:function(enable) {
		if(enable===undefined) enable=true;
		document.getElementById("warning_data_info").style.display=((enable)?(''):('none'));
		document.getElementById("warning_data_info").innerHTML='<h3><span id="txt8">'+Translation[Lang.language].txt8+'</span></h3>';
		document.getElementById("loading_data_info").style.display=((enable)?('none'):(''));
	},
	
	loadData: function(error, data) {
		if(error) {
	    	console.log(error);
	    	return false;
		}else{
			graph.totalRows = data.length;
			graph.jsonData = data;
			graph.normalizeData();
			return true;
		}
	},

	startLoadData: function() {

		var afterLoadConfiguration=function(cfg) {
			graph.displayWaiting();
			var configDashboard={defaultDataDimension:'count', resizeTimeout:0, minWidth:250, dataConfig:cfg};
			//var dataUrl = downloadCtrl.serviceBaseUrl+"/download/"+downloadCtrl.getProject()+"/daily";
			var dataUrl = "./data/focuses-of-fires.json";
			var afterLoadData=function(json) {
				Lang.apply();
				if(!json || !json.features) {
					graph.displayWarning(true);
				}else{
					graph.init(configDashboard, json.features);
				}
			};
			d3.json(dataUrl)
			.get(function(error, root) {
				if(error && error.status==401) {
					console.error(error);
				}else{
					afterLoadData(root);
				}
			});
		};
		d3.json("./config/"+downloadCtrl.getProject()+".json", afterLoadConfiguration);
	},

	loadUpdatedDate: function() {
		var url="./data/updated-date.json";

		d3.json(url, (json) => {
			var dt=new Date(json.features[0].properties.updated_date+'T21:00:00.000Z');
			d3.select("#updated_date").html(' '+dt.toLocaleDateString());
		});
	},
	
	setDataDimension: function(d) {
		this.config.defaultDataDimension=d;
		this.storeSelectedFilter();
		this.resetFilters();
		this.build();
		this.updateToSelectedFilter();
	},

	storeSelectedFilter: function() {
		graph.selectedFilters={};// reset stored filter
		if(graph.histTopByCounties.hasFilter())
			graph.selectedFilters.byCounty=graph.histTopByCounties.filters();
		if(graph.lineDistributionByMonth.hasFilter())
			graph.selectedFilters.byMonth=graph.lineDistributionByMonth.filters();
		if(graph.ringTotalizedByState.hasFilter())
			graph.selectedFilters.byState=graph.ringTotalizedByState.filters();
		if(graph.histTopByCLs.hasFilter())
			graph.selectedFilters.byUCs=graph.histTopByCLs.filters();
	},

	updateToSelectedFilter: function() {
		if(graph.selectedFilters.byCounty)
			while(graph.selectedFilters.byCounty.length) {graph.histTopByCounties.filter(graph.selectedFilters.byCounty.pop());}
		if(graph.selectedFilters.byMonth)
			while(graph.selectedFilters.byMonth.length) {graph.lineDistributionByMonth.filter(graph.selectedFilters.byMonth.pop());}
		if(graph.selectedFilters.byState)
			while(graph.selectedFilters.byState.length) {graph.ringTotalizedByState.filter(graph.selectedFilters.byState.pop());}
		if(graph.selectedFilters.byUCs)
			while(graph.selectedFilters.byUCs.length) {graph.histTopByCLs.filter(graph.selectedFilters.byUCs.pop());}

		dc.redrawAll();
	},
	
	resetFilters:function() {
		graph.lineDistributionByMonth.filterAll();
		//graph.ringTotalizedByClass.filterAll();
		graph.histTopByCounties.filterAll();
		graph.ringTotalizedByState.filterAll();
		graph.histTopByCLs.filterAll();
		SearchEngine.applyCountyFilter();
	},

	utils:{

		setStateAnimateIcon: function(id, enable, error) {
			document.getElementById(id).style.display='';
			if(enable) {
				document.getElementById(id).className="glyphicon glyphicon-refresh glyphicon-refresh-animate";
			}else {
				document.getElementById(id).className="glyphicon " + ( (error)?("glyphicon-warning-sign glyphicon-red"):("glyphicon-ok glyphicon-green") );
			}
		},
		getSelectedFormatFile: function() {
			var opt=document.getElementById('download-option');
			if(!opt) {
				opt="SHAPE-ZIP";
			}
			return opt[opt.selectedIndex].value;
		},
		/*
		 * Remove numeric values less than 1e-6
		 */
		removeLittlestValues:function(sourceGroup) {
			return {
				all:function () {
					return sourceGroup.all().filter(function(d) {
						return (Math.abs(d.value)<1e-6) ? 0 : d.value;
					});
				},
				top: function(n) {
					return sourceGroup.top(Infinity)
						.filter(function(d){
							return (Math.abs(d.value)>1e-6);
							})
						.slice(0, n);
				}
			};
		},

		/* Insert a title into one chart using a div provided by elementId.
		   Use %dim% or %Dim% to insert a dimension name or capitalize first letter of the name into your title string.
		 */
		setTitle:function(elementId, title) {
			elementId='title-chart-'+elementId;
			document.getElementById(elementId).innerHTML=this.wildcardExchange(title);
		},
		
		wildcardExchange:function(str) {
			var dim=((graph.config.defaultDataDimension=='area')?(Translation[Lang.language].areas):(Translation[Lang.language].num_focus));
			var unit=((graph.config.defaultDataDimension=='area')?('km²'):(Translation[Lang.language].unit_focus));
			str=str.replace(/%dim%/gi,function(x){return (x=='%Dim%'?dim.charAt(0).toUpperCase()+dim.slice(1):dim);});
			str=str.replace(/%unit%/gi,function(x){return (x=='%Unit%'?unit.charAt(0).toUpperCase()+unit.slice(1):unit);});
			return str;
		},
		
		numberByUnit:function(num) {
			let percent=(num*100/graph.totalRows).toFixed(1)+"%";
			// return ((graph.config.defaultDataDimension=='area')?(num.toFixed(2)):(num.toFixed(0)));
			let nf=localeBR.numberFormat(',')
			return nf(num.toFixed(0)) + " ("+percent+")";
		},

		onResize:function(event) {
			clearTimeout(graph.config.resizeTimeout);
  			graph.config.resizeTimeout = setTimeout(graph.doResize, 100);
		},

		getDefaultHeight:function() {
			return ((window.innerHeight*0.4).toFixed(0))*1;
		}
	},
	doResize:function() {
		graph.defaultHeight = graph.utils.getDefaultHeight();
		dc.renderAll();
	},
	normalizeData:function() {
		//var numberFormat = d3.format('.4f');
		var json=[];
		// normalize/parse data
		this.jsonData.forEach(function(d) {
			var o={uf:d.properties.d,ocl:d.properties.b,county:d.properties.e};
			o.cl = (d.properties.b)?(d.properties.b):('null');
			var auxDate = new Date(d.properties.f + 'T04:00:00.000Z');
			o.timestamp = auxDate.getTime();
			// o.areaKm = numberFormat(d.properties.e)*1;// area municipio
			// o.areaUcKm = ((d.properties.f)?(numberFormat(d.properties.f)*1):(0));
			json.push(o);
		});
		
		this.jsonData=json;
		delete json;
	},
	
	build:function() {
		
		var dimensions=[];
		// set crossfilter
		var alerts = crossfilter(this.jsonData);
		//dimensions["area"] = alerts.dimension(function(d) {return d.areaKm;});
		dimensions["county"] = alerts.dimension(function(d) {return d.county+"/"+d.uf;});
		//dimensions["class"] = alerts.dimension(function(d) {return d.className;});
		dimensions["date"] = alerts.dimension(function(d) {return d.timestamp;});
		dimensions["uf"] = alerts.dimension(function(d) {return d.uf;});
		//dimensions["cl"] = alerts.dimension(function(d) {return d.cl+"/"+d.uf;});
		dimensions["cl"] = alerts.dimension(function(d) {return d.cl;});
		
		graph.utils.dimensions=dimensions;
		
		var totalAreaGroup = alerts.groupAll().reduce(
		            function (p, v) {
		                ++p.n;
		                p.tot += v.areaKm;
		                return p;
		            },
		            function (p, v) {
		                --p.n;
		                p.tot -= v.areaKm;
		                return p;
		            },
		            function () { return {n:0,tot:0}; }
		        ),
		    totalAlertsGroup = alerts.groupAll().reduce(
		        function (p, v) {
		            ++p.n;
		            return p;
		        },
		        function (p, v) {
		            --p.n;
		            return p;
		        },
		        function () { return {n:0}; }
		    );
		
		var groups=[];
		if(graph.config.defaultDataDimension=="area") {
			//groups["class"] = dimensions["class"].group().reduceSum(function(d) {return +d.areaKm;});
			groups["county"] = dimensions["county"].group().reduceSum(function(d) {return +d.areaKm;});
			groups["uf"] = dimensions["uf"].group().reduceSum(function(d) {return +d.areaKm;});
			groups["date"] = dimensions["date"].group().reduceSum(function(d) {return +d.areaKm;});
			groups["cl"] = dimensions["cl"].group().reduceSum(function(d) {return (d.cl!='null')?(+d.areaUcKm):(0);});
		}else{
			//groups["class"] = dimensions["class"].group().reduceCount(function(d) {return d.className;});
			groups["county"] = dimensions["county"].group().reduceCount(function(d) {return d.county;});
			groups["uf"] = dimensions["uf"].group().reduceCount(function(d) {return d.uf;});
			groups["date"] = dimensions["date"].group().reduceCount(function(d) {return +d.timestamp;});
			groups["cl"] = dimensions["cl"].group().reduceSum(function(d) {return (d.cl!='null')?(1):(0);});
		}

		var htmlBox="<div class='icon-left'><i class='fa fa-fire fa-2x hackicon' aria-hidden='true'></i></div><span class='number-display'>";
		
		// this.totalizedAreaInfoBox.formatNumber(localeBR.numberFormat(',1f'));
		// this.totalizedAreaInfoBox.valueAccessor(function(d) {return d.n ? d.tot.toFixed(2) : 0;})
	  //     .html({
		// 	one:htmlBox+"<span>"+Translation[Lang.language].deforestation+"</span><br/><div class='numberinf'>%number km²</div></span>",
		// 	some:htmlBox+"<span>"+Translation[Lang.language].deforestation+"</span><br/><div class='numberinf'>%number km²</div></span>",
		// 	none:htmlBox+"<span>"+Translation[Lang.language].deforestation+"</span><br/><div class='numberinf'>0 km²</div></span>"
	  //     })
	  //     .group(totalAreaGroup);
		

		// build totalized Alerts box
		this.totalizedAlertsInfoBox.formatNumber(localeBR.numberFormat(','));
		this.totalizedAlertsInfoBox.valueAccessor(function(d) {return (d.n)?(d.n):(0);})
		.html({
			one:htmlBox+"<span>"+Translation[Lang.language].num_alerts+"</span><br/><div class='numberinf'>%number</div></span>",
			some:htmlBox+"<span>"+Translation[Lang.language].num_alerts+"</span><br/><div class='numberinf'>%number</div></span>",
			none:htmlBox+"<span>"+Translation[Lang.language].num_alerts+"</span><br/><div class='numberinf'>0</div></span>"
		})
		.group(totalAlertsGroup);
		
		this.buildCharts(dimensions, groups);
	},
	
	buildCharts:function(dimensions,groups) {
		
		var alertsMaxDate = dimensions["date"].top(1),
		alertsMinDate = dimensions["date"].bottom(1);
		
		// build area or alerts by time
		// -----------------------------------------------------------------------
		graph.utils.setTitle('timeline', Translation[Lang.language].timeline_header);

		var lastDate=new Date(alertsMaxDate[0].timestamp),
		firstDate=new Date(alertsMinDate[0].timestamp);
		lastDate=new Date(lastDate.setMonth(lastDate.getMonth()+1));
		lastDate=new Date(lastDate.setDate(lastDate.getDate()+7));
		firstDate=new Date(firstDate.setDate(firstDate.getDate()-7));
		
		var dateFormat = localeBR.timeFormat('%d/%m/%Y');
		var x = d3.time.scale().domain([firstDate, lastDate]);
		var yLabel = ((graph.config.defaultDataDimension=='area')?
				(graph.utils.wildcardExchange("%Dim%") + " (" + graph.utils.wildcardExchange("%unit%")+")"):
					(graph.utils.wildcardExchange("%Unit%")));
		
		this.lineDistributionByMonth
			.height(310)
			.margins({top: 10, right: 45, bottom: 55, left: 45})
			.yAxisLabel( yLabel )
			//.xAxisLabel( Translation[Lang.language].timeline_desc + " " + dateFormat(new Date(alertsMinDate[0].timestamp)) + " - " + dateFormat(new Date(alertsMaxDate[0].timestamp)) )
			.dimension(dimensions["date"])
			.group(groups["date"])
			.transitionDuration(300)
			.elasticY(true)
			.x(x)
			.renderHorizontalGridLines(true)
			.renderVerticalGridLines(true)
			.colors(d3.scale.ordinal().range([((graph.cssDefault)?('black'):('gold'))]));
		
		this.lineDistributionByMonth
			.on('preRender', function(chart) {
				chart
				.xUnits(d3.time.days)
				.xAxis(d3.svg.axis()
					.scale(x)
					.orient("bottom")
					.ticks(d3.time.months)
					.tickFormat( function(d) {
						var dt=d.toLocaleDateString();
						var adt=d.toLocaleDateString().split("/");
						if((chart.effectiveWidth()<graph.config.minWidth)) {
							dt=Translation[Lang.language].months_names[d.getMonth()] + "/" + adt[2];
						}else {
							dt=adt[0] + "/" + Translation[Lang.language].months_names[d.getMonth()] + "/" + adt[2];
						}
						// var dt=localeBR.timeFormat( (chart.effectiveWidth()<graph.config.minWidth)?("%b/%Y"):("%d/%b/%Y") )(d);
						return dt;
					})
				);
				chart
				.yAxis()
				//.ticks(5)
				.tickFormat(d3.format('.2s'));
			});

		this.lineDistributionByMonth.on("renderlet.a",function (chart) {
			   // rotate x-axis labels
			chart.selectAll('g.x text')
				.attr('transform', 'translate(-10,20) rotate(315)');
			if(!chart.hasFilter()){
				$('#txt9a').css('display','none');
				$('#highlight-time').css('display','');
				$('#txt9').html(Translation[Lang.language].allTime);
				$('#highlight-time').html(" " + dateFormat(new Date(alertsMinDate[0].timestamp)) + " - " + dateFormat(new Date(alertsMaxDate[0].timestamp)) );
			}else{
				$('#txt9a').css('display','');
				$('#highlight-time').css('display','none');
				$('#txt9').html(Translation[Lang.language].txt9);
			}
		});
		
         this.lineDistributionByMonth
			.filterPrinter(function(f) {
				var dt=new Date(f[0][0]);
				dt.setDate(dt.getDate()+1);
				return " " + dateFormat(dt) + " - " + dateFormat(f[0][1]);
		});
		// -----------------------------------------------------------------------
		
		// build top areas or alerts by county
		graph.utils.setTitle('counties', Translation[Lang.language].title_top_county);
		
		this.histTopByCounties
			.height(graph.defaultHeight)
			.dimension(dimensions["county"])
			.group(this.utils.removeLittlestValues(groups["county"]))
			.elasticX(true)
			.ordering(function(d) {return d.county;})
			.controlsUseVisibility(true)
			.ordinalColors([(graph.cssDefault)?(graph.barTop10Color):(graph.darkBarTop10Color)]);
			//.ordinalColors(["#FF4500","#FF8C00","#FFA500","#FFD700","#FFFF00","#BA55D3","#9932CC","#8A2BE2","#3182BD","#6BAED6"]);

		this.histTopByCounties
			.on('preRender', function(chart) {
				chart.height(graph.defaultHeight);
				chart.xAxis().ticks((chart.width()<graph.config.minWidth)?(5):(6));
			});
		
		this.histTopByCounties
			.on('preRedraw', function (chart) {
				if(chart.data().length > 5){
					chart.fixedBarHeight(false);
				}else{
					chart.fixedBarHeight( parseInt((chart.effectiveHeight()*0.7)/10) );
				}
			});

		this.histTopByCounties
			.on("renderlet.a",function (chart) {
				var texts=chart.selectAll('g.row text');
				var rankMun=function() {
					var allTop=groups["county"].top(Infinity);
					var ar={};
					allTop.forEach(function(k,i){ar["\""+k.key+"\""]=(i+1);});
					return ar;
				};
				texts[0].forEach(function(t){
					var p=(rankMun()["\""+t.innerHTML.split(":")[0]+"\""])?(rankMun()["\""+t.innerHTML.split(":")[0]+"\""]+'º - '):('');
					t.innerHTML=p+t.innerHTML;
				});
			});

		this.histTopByCounties.xAxis()
		.tickFormat(function(d) {return d;});

		this.histTopByCounties.data(function (group) {
			var fakeGroup=[];
			fakeGroup.push({key:Translation[Lang.language].without,value:0});
			return (group.all().length>0)?(group.top(10)):(fakeGroup);
		});
		this.histTopByCounties.title(function(d) {return d.key + ': ' + graph.utils.numberByUnit(d.value) + graph.utils.wildcardExchange(" %unit%");});
		this.histTopByCounties.label(function(d) {return d.key + ': ' + graph.utils.numberByUnit(d.value) + graph.utils.wildcardExchange(" %unit%");});

		// build graph areas or alerts by state
		graph.utils.setTitle('state',Translation[Lang.language].title_tot_state);
		
		this.ringTotalizedByState
			.height(graph.defaultHeight)
			.innerRadius(10)
			.externalRadiusPadding(30)
			.dimension(dimensions["uf"])
			.group(this.utils.removeLittlestValues(groups["uf"]))
			.ordering(dc.pluck('key'))
			.ordinalColors((graph.cssDefault)?(graph.pallet):(graph.darkPallet))
			.legend(dc.legend().x(20).y(10).itemHeight(13).gap(7).horizontal(0).legendWidth(50).itemWidth(35));
			//.legend(dc.legend().x(50).y(0).itemHeight(13).gap(7).horizontal(1).legendWidth(100).itemWidth(100));
			//.legend(dc.legend());

		// this.ringTotalizedByState
		// 	.on('postRender', function(chart) {
		// 		var lh=chart.height();
		// 		var ph=(chart.selectAll('g.pie-slice-group')).node().getBBox().height;
				
		// 		var cy=lh-ph/2;
		// 		chart.cy(cy);
		// 		chart.redraw();
		// 	});

		// this.ringTotalizedByState
		// 	.on('postRender', function(chart) {
		// 		var lw=chart.width();
		// 		var pw=(chart.selectAll('g.pie-slice-group')).node().getBBox().width;
				
		// 		var cx=(lw-pw/2)-10;
		// 		chart.cx(cx);
		// 		chart.redraw();
		// 	});
		
		this.ringTotalizedByState
			.on('preRender', function(chart) {
				chart.height(graph.defaultHeight);
				chart.legend().legendWidth(window.innerWidth/2);
			});
		
		this.ringTotalizedByState.title(function(d) { 
			return (d.key!='empty')?(d.key + ': ' + graph.utils.numberByUnit(d.value) + graph.utils.wildcardExchange(" %unit%")):(Translation[Lang.language].without);
		});

		this.ringTotalizedByState
			.renderLabel(true)
			.minAngleForLabel(0.5);

		this.ringTotalizedByState.label(function(d) {
			var txtLabel=(d.key!='empty')?(graph.utils.numberByUnit(d.value) + graph.utils.wildcardExchange(" %unit%")):(Translation[Lang.language].without);
			if(graph.ringTotalizedByState.hasFilter()) {
				var f=graph.ringTotalizedByState.filters();
				return (f.indexOf(d.key)>=0)?(txtLabel):('');
			}else{
				return txtLabel;
			}
		});

		if(!graph.ctlFirstLoading) {
			dc.override(this.ringTotalizedByState, 'legendables', function() {
				var legendables = this._legendables();
				return legendables.filter(function(l) {
					return l.data > 0;
				});
			});
		}
		
		// build top areas or alerts by ucs
		graph.utils.setTitle('ucs', Translation[Lang.language].title_top_uc);

		this.histTopByCLs
			.height(graph.defaultHeight)
			.dimension(dimensions["cl"])
			.group(this.utils.removeLittlestValues(groups["cl"]))
			.elasticX(true)
			.ordering(function(d) { return d.cl; })
			.controlsUseVisibility(true)
			.ordinalColors([(graph.cssDefault)?(graph.barTop10Color):(graph.darkBarTop10Color)]);
			//.ordinalColors(["#FF4500","#FF8C00","#FFA500","#FFD700","#FFFF00","#BA55D3","#9932CC","#8A2BE2","#3182BD","#6BAED6"]);

		this.histTopByCLs
			.on('preRender', function(chart) {
				chart.height(graph.defaultHeight);
				chart.xAxis().ticks((chart.width()<graph.config.minWidth)?(4):(7));
			});

		this.histTopByCLs
			.on('preRedraw', function (chart) {
				if(chart.data().length > 5){
					chart.fixedBarHeight(false);
				}else{
					chart.fixedBarHeight( parseInt((chart.effectiveHeight()*0.7)/10) );
				}
			});

		this.histTopByCLs
			.on("renderlet.a",function (chart) {
				var texts=chart.selectAll('g.row text');
				var rankMun=function() {
					var allTop=groups["cl"].top(Infinity);
					var ar={};
					allTop.forEach(function(k,i){ar["\""+k.key+"\""]=(i+1);});
					return ar;
				};
				texts[0].forEach(function(t){
					var p=(rankMun()["\""+t.innerHTML.split(":")[0]+"\""])?(rankMun()["\""+t.innerHTML.split(":")[0]+"\""]+'º - '):('');
					t.innerHTML=p+t.innerHTML;
				});
			});
			
		this.histTopByCLs.xAxis().tickFormat(function(d) {return d;});
		this.histTopByCLs.data(function (group) {
			var fakeGroup=[];
			fakeGroup.push({key:Translation[Lang.language].without,value:0});
			return (group.all().length>0)?(group.top(10)):(fakeGroup);
		});
		this.histTopByCLs.title(function(d) {return d.key + ': ' + graph.utils.numberByUnit(d.value) + graph.utils.wildcardExchange(" %unit%");});
		this.histTopByCLs.label(function(d) {return d.key + ': ' + graph.utils.numberByUnit(d.value) + graph.utils.wildcardExchange(" %unit%");});

		// build download data
		d3.select('#download-csv-daily-all')
	    .on('click', function() {
	    	graph.utils.download=function(data) {
		        var blob = new Blob([d3.csv.format(data)], {type: "text/csv;charset=utf-8"});
		        saveAs(blob, downloadCtrl.getProject()+'-daily-'+downloadCtrl.getDownloadTime()+'.csv');
	    	};
	    	window.setTimeout(function() {
	    		var data=[];
		    	graph.jsonData.forEach(function(d) {
		    		var o={};
		    		var dt = new Date(d.timestamp);
		    		o.viewDate = dt.toLocaleDateString();
		    		//o.mes = dt.getMonth()+1;
		    		//o.ano = dt.getFullYear();
		    		//o.totalAlertas = d.k;
				    o.areaMunKm = parseFloat(d.areaKm.toFixed(4));
			    	o.areaUcKm = parseFloat(d.areaUcKm.toFixed(4));
				    o.cl = ((d.cl!='null')?(d.cl):(''));
				    o.uf = d.uf;
				    o.municipio = d.county;
				    data.push(o);
				});
		    	graph.utils.download(data);
	    	}, 200);
		});
		
		// shapefile 
		d3.select('#download-shp')
		.on('click', function() {
			downloadCtrl.startDownload();
		});

		d3.select('#download-csv-daily')
	    .on('click', function() {
	    	graph.utils.download=function(data) {
		        var blob = new Blob([d3.csv.format(data)], {type: "text/csv;charset=utf-8"});
		        saveAs(blob, downloadCtrl.getProject()+'-daily-'+downloadCtrl.getDownloadTime()+'.csv');
	    	};
	    	window.setTimeout(function() {
	    		var data=[];
	    		var filteredData=graph.utils.dimensions["uf"].top(Infinity);
	    		filteredData.forEach(function(d) {
		    		var o={};
		    		var dt = new Date(d.timestamp);
		    		o.viewDate = dt.toLocaleDateString();
				    o.areaMunKm = parseFloat(d.areaKm.toFixed(4));
			    	o.areaUcKm = parseFloat(d.areaUcKm.toFixed(4));
				    o.cl = ((d.cl!='null')?(d.cl):(''));
				    o.uf = d.uf;
				    o.municipio = d.county;
				    data.push(o);
				});
		    	graph.utils.download(data);
	    	}, 200);
	    });
		
		d3.select('#prepare_print')
	    .on('click', function() {
	    	graph.preparePrint();
	    });
		
		graph.doResize();
		window.onresize=this.utils.onResize;
		this.ctlFirstLoading=true;// to config for exec only once
	},
	preparePrint: function() {
		d3.select('#print_information').style('display','block');
		d3.select('#print_page')
	    .on('click', function() {
	    	d3.select('#print_information').style('display','none');
	    	window.print();
	    });
	},

	configurePrintKeys:function() {
		Mousetrap.bind(['command+p', 'ctrl+p'], function() {
	        console.log('command p or control p is disabled');
	        // return false to prevent default browser behavior
	        // and stop event from bubbling
	        return false;
	    });
	},
	restart() {
		graph.startLoadData();
	}
	
};

window.onload=function(){
	graph.configurePrintKeys();
	Lang.init();
	graph.startLoadData();
};