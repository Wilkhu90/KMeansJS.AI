(function() {

	var MIN_COORDINATE = 0,
		MAX_COORDINATE = 10,
		NUM_POINTS = 200,
		NUM_CLUSTERS = 3;

	var kmeans, data, afterData = [];

	var draw = function () {
		data = [];
		kmeans.points.forEach(function(point) {
			data.push([point.x, point.y]);
		});
   
	    var margin = {top: 20, right: 15, bottom: 60, left: 60}
	      , width = 960 - margin.left - margin.right
	      , height = 500 - margin.top - margin.bottom;
	    
	    var x = d3.scale.linear()
	              .domain([0, d3.max(data, function(d) { return d[0]; })])
	              .range([ 0, width ]);
	    
	    var y = d3.scale.linear()
	    	      .domain([0, d3.max(data, function(d) { return d[1]; })])
	    	      .range([ height, 0 ]);
	 
	    var chart = d3.select('body')
		.append('svg:svg')
		.attr('width', width + margin.right + margin.left)
		.attr('height', height + margin.top + margin.bottom)
		.attr('class', 'chart')

	    var main = chart.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
		.attr('width', width)
		.attr('height', height)
		.attr('class', 'main')   
	        
	    // draw the x axis
	    var xAxis = d3.svg.axis()
		.scale(x)
		.orient('bottom');

	    main.append('g')
		.attr('transform', 'translate(0,' + height + ')')
		.attr('class', 'main axis date')
		.call(xAxis);

	    // draw the y axis
	    var yAxis = d3.svg.axis()
		.scale(y)
		.orient('left');

	    main.append('g')
		.attr('transform', 'translate(0,0)')
		.attr('class', 'main axis date')
		.call(yAxis);

	    var g = main.append("svg:g"); 
	    
	    g.selectAll("scatter-dots")
	      .data(data)
	      .enter().append("svg:circle")
	          .attr("cx", function (d,i) { return x(d[0]); } )
	          .attr("cy", function (d) { return y(d[1]); } )
	          .attr("r", 8);
	    
	    chart.on('click', function() {
			kmeans.calculate();
			var newData = [];
			kmeans.clusters.forEach(function(cluster) {
				var centroid = cluster.centroid;
				console.log(centroid);
				newData.push([centroid.x, centroid.y]);
			});

			g.selectAll("scatter-dots")
		      .data(newData)
		      .enter().append("svg:circle")
		          .attr("cx", function (d,i) { return x(d[0]); } )
		          .attr("cy", function (d) { return y(d[1]); } )
		          .attr("r", 10)
		          .style("fill", "red");

		    kmeans.clusters.forEach(function(cluster) {
				var points = [cluster.points];
				afterData.push(points);
			});
			afterData.forEach(function(arr){
				var points = [];
				for(var i=0; i<arr.length; i++){
					console.log(arr[i]);
					var pp = arr[i];
					pp.forEach(function(point) {
						points.push([point.x, point.y]);
					});
				}
				g.selectAll("scatter-dots")
			      .data(points)
			      .enter().append("svg:circle")
			          .attr("cx", function (d,i) { return x(d[0]); } )
			          .attr("cy", function (d) { return y(d[1]); } )
			          .attr("r", 10)
			          .style("fill", "#"+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6));
			});
			
		});
	};

	function main() {
		kmeans = new KMeans();
		kmeans.init();
		draw();
	}

	// Point class
	function Point(x, y, cluster_id) {
		this.x = x;
		this.y = y;
		this.cluster_id = cluster_id || -1;
	}

	Point.prototype = {

		distance: function(p, centroid) {
			return Math.sqrt( Math.pow( Math.abs(p.x - centroid.x) , 2) + Math.pow( Math.abs(p.y - centroid.y) , 2) );
		},

		createRandomPoint: function(min, max) {
			var randX = Math.random()*(max - min) + min;
			var randY = Math.random()*(max - min) + min;
			return new Point(randX, randY);
		},
		createRandomPoints: function(min, max, numberOfPoints) {
			var points = [];
			for(var i=0; i<numberOfPoints; i++){
				points.push(Point.prototype.createRandomPoint.call(this, min, max));
			}
			return points;
		}

	};

	// Centroid Class
	function Cluster(cluster_id) {
		this.cluster_id = cluster_id;
		this.points = [];
		this.centroid = null;
	}

	Cluster.prototype = {

		clear: function() {
			this.points = [];
		},

		plotCluster: function() {
			console.log('Cluster: '+ this.cluster_id);
			console.log('Centroid: '+ this.centroid.x + ' : ' + this.centroid.y);
			console.log('Points are:');
			for(var p in this.points){
				console.log(this.points[p]);
			}
		}

	};

	// Implementation of K-Means Clustering
	function KMeans() {
		this.points = [];
		this.clusters = [];
	}

	KMeans.prototype = {

		init: function() {
			this.points = Point.prototype.createRandomPoints.call(this, MIN_COORDINATE, MAX_COORDINATE, NUM_POINTS);
			
			for(var i=0; i<NUM_CLUSTERS; i++){
				var cluster = new Cluster(i);
				var centroid = Point.prototype.createRandomPoint.call(this, MIN_COORDINATE, MAX_COORDINATE);
				cluster.centroid = centroid;
				this.clusters.push(cluster);
			}
			this.plotClusters();

		},

		plotClusters: function() {
			for(var i=0; i<NUM_CLUSTERS; i++){
				var c = this.clusters[i];
				c.plotCluster();
			}
		},

		calculate: function() {
			var finish = false;
			var iter = 0;

			while(!finish) {
				this.clearClusters();
				var lastCentroids = this.getCentroids();
				this.assignCluster();

				this.calculateCentroids();

				iter++;

				var currentCentroids = this.getCentroids();
				var distance = 0;
				for(var i=0; i<lastCentroids.length; i++){
					distance += Point.prototype.distance.call(this, lastCentroids[i], currentCentroids[i]);
				}
				console.log('################');
				console.log('Iteration: '+ iter);
				console.log('Centroid distances: '+ distance);

				this.plotClusters();

				if(distance == 0){
					finish = true;
				}
			}
		},

		clearClusters: function() {
			for(var cluster in this.clusters){
				this.clusters[cluster].clear();
			}
		},

		getCentroids: function() {
			var centroids = [];
			for(var cluster in this.clusters){
				var aux = this.clusters[cluster].centroid;
				var point = new Point(aux.x, aux.y);
				centroids.push(point);
			}
			return centroids;
		},

		assignCluster: function() {
			var max = Number.MAX_VALUE,
				min = max;

			var cluster = 0;
			var distance = 0;
			for(var point in this.points) {
				min = max;
				for(var i=0; i<NUM_CLUSTERS; i++){
					var c = this.clusters[i];
					distance = Point.prototype.distance.call(this, this.points[point], c.centroid);
					if(distance < min) {
						min = distance;
						cluster = i;
					}
				}
				this.points[point].cluster_id = cluster;
				this.clusters[cluster].points.push(this.points[point]);
			}
		},

		calculateCentroids: function() {
			for(var cluster in this.clusters){
				var sumX = 0, sumY = 0;
				var list = this.clusters[cluster].points;
				var n_points = list.length;
				for(var point in list) {
					sumX += this.clusters[cluster].points[point].x;
					sumY += this.clusters[cluster].points[point].y;
				}
				if(n_points > 0) {
					var newX = sumX / n_points;
					var newY = sumY / n_points;

					this.clusters[cluster].centroid.x = newX;
					this.clusters[cluster].centroid.y = newY;
				}
			}
		}

	};

	// Main program that run
	main();

}());