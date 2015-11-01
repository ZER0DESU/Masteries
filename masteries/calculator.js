var treeNames = [
    "Ferocity",
    "Cunning",
    "Resolve",
];
var treeOffsets = [
    0,
    data[0].length,
    data[0].length + data[1].length
];
var MAX_POINTS = 30;
var TIER_REQS = [0, 5, 6, 11, 12, 17];
var TREE_OFFSET = 276;
var SPACING = {margin_left: 44, margin_top: 20, margin_keystone: 35, spacing_x: 13, spacing_y: 20}
var BUTTON_SIZE = 54;
var state = [{}, {}, {}];
var totalPoints = 0;
var buttonClasses = ["unavailable", "available", "full"];
var rankClasses = ["num-unavailable", "num-available", "num-full"];
var counterClasses = ["counter-unavailable", "counter-available", "counter-full"];

function drawCalculator() {
    for (var tree = 0; tree < 3; tree++)
        for (var index = 0; index < data[tree].length; index++)
            drawButton(tree, index);

    // make tooltip
    var tip, maxDims = {width: $("#calculator").parent().width(), height: $("#calculator").parent().height()};
    $("#calculator")
        .contextmenu(function(event){ event.preventDefault() })
        .append(
            $("<div>")
                .attr('id', "tooltip")
                .append($("<strong>"))
                .append(
                    $("<div>")
                        .addClass("rank")
                )
                .append(
                    $("<div>")
                        .addClass("req")
                )
                .append(
                    $("<p>")
                        .addClass("tooltip-text")
                        .addClass("first")
                )
                .append(
                    $("<p>")
                        .addClass("tooltip-text")
                        .addClass("second")
                        .append(
                            $("<div>")
                                .addClass("nextRank")
                                .text("Next rank:")
                        )
                        .append(
                            $("<div>")
                                .addClass("content")
                        )
                )
        );

    // mousemove event global since it follows tooltip visibility
    var anchor = $("#calculator");
    $(window)
        .mousemove(function(event){
            if (tip.is(":visible")) {
                // boundary checking for tooltip (right and bottom sides)
                var pos = anchor.offset();
                var offsetX = 20, offsetY = 20;
                if (event.pageX - pos.left + tip.width() > maxDims.width - 30)
                    offsetX = -tip.width() - 20;
                if (event.pageY - pos.top + tip.height() > maxDims.height )
                    offsetY = -tip.height() - 20;
                tip.css({
                    left: event.pageX - pos.left + offsetX,
                    top:  event.pageY - pos.top + offsetY,
                });
            }
        });
    tip = $("#tooltip");

    $("#points>.count").text(MAX_POINTS);
}

// L
function deltaMastery(tree, index, rank, deltaR) {
	if (isValidState(tree, index, rank, deltaR)) {
		// L
		if (MUSIC) {
			if (deltaR > 0) 
				action_sound = (data[tree][index].tier == 5) ? sounds_peak : (rank + deltaR == data[tree][index].ranks ? sounds_unlock : sounds_add);
			else 
				action_sound = sounds_remove;
		}
		var previous = masteryTierFull(tree, index);
		// If we're removing points from alternative mastery
		if (previous >= 0 && deltaR > 0)
		{
			setState(tree, previous, state[tree][previous], -deltaR);
			if (MUSIC && action_sound == sounds_unlock) action_sound = sounds_add;
		}
		setState(tree, index, rank, deltaR);
	}
}

function drawButton(tree, index) {
    var spritePos = masterySpritePos(tree, index);
    var buttonPos = masteryButtonPosition(tree, index);
    var status = data[tree][index].tier == 0 ? "available" : "unavailable";
    var rank = 0;
	var tier = data[tree][index].tier;
		
    $("#calculator").append(
        $("<div>")
            .addClass("button")
            .addClass(status)
            //.data("buttonFrame", buttonFrame)
            .css({
                left: buttonPos.x+"px",
                top: buttonPos.y+"px",
                // Sprite has three columns: 0px is color, -54 is desaturated and -108px is black and white
                backgroundPosition: (status == "full" ? -2 : status == "available" ? -2 - BUTTON_SIZE : -2 - 2*BUTTON_SIZE) + "px " + 
                                    (spritePos - 2) + "px",
            })
			.append(
				$("<div>")
					.addClass("buttonFrame")
					.css({ // Why? Well: it works
						backgroundPosition: (status == "full" ? (tier%2 == 1 ? (tier == 1 ? -152 : -76 * tier) : -76) : status == "available" ? -76 : 0) + "px " + 
                                    (status == "full" ? (tier == 3 ? -76 : (tier == 5 ? -152 : 0) ) : 0) + "px",
						})
			)
            .append(
                $("<div>")
                    .addClass("counter")
                    .addClass("counter-"+status)
                    .text("0/" + data[tree][index].ranks)
					.css({visibility: data[tree][index].tier % 2 == 0 ? "visible" : "hidden"}) // L
            )
            .mouseover(function(event){
                var tooltipText = masteryTooltip(tree, index, rank);
                formatTooltip($("#tooltip").show(), tooltipText);
                $(this).data("hover", true);
                $(this).parent().mousemove();
            })
            .mouseout(function(){
                $("#tooltip").hide();
                $(this).data("hover", false);
            })
            .mousedown(function(event){
                switch (event.which) {
                    case 1:
                        // Left click
                        deltaMastery(tree, index, rank, +1);
                        break;
                    case 3:
                        // Right click
                        deltaMastery(tree, index, rank, -1);
                        break;
                }
            })
			.mousewheel(function(event, delta){deltaMastery(tree, index, rank, delta);}) 
            .data("update", function() {
                rank = state[tree][index] || 0;
                if (rank > 0) { // used to be "== data[tree][index].ranks"
                    status = "full";
                } else {
                    // check if available
                    if (masteryPointReq(tree, index) <= treePoints(tree))
						status = "available";
                    else
                        status = "unavailable";


                    // check if points can be spent
                    if (totalPoints >= MAX_POINTS)
                        if (masteryTierFull(tree, index) >= 0) // used to be "rank > 0"
                            status = "available";
                        else
							status = "unavailable";
                }
                // change status class
                if ( !$(this).hasClass(status) ) {
                    $(this)
                        .removeClass(buttonClasses.join(" "))
                        .addClass(status)
                        .css({
                            backgroundPosition: (status == "full" ? -2 : status == "available" ? -2 - BUTTON_SIZE : -2 - 2*BUTTON_SIZE) + "px " + 
												(spritePos - 2) + "px",
                        });
                }
                // adjust counter
                var counter = $(this).find(".counter").text(rank + "/" + data[tree][index].ranks);
                if ( !counter.hasClass("counter-"+status) ) {
                    counter
                        .removeClass(counterClasses.join(" "))
                        .addClass("counter-"+status)
						//.css({visibility: data[tree][index].tier % 2 == 0 ? "visible" : "hidden"}) // L
                }
				$(this).find(".buttonFrame").css({
							backgroundPosition: (status == "full" ? (tier%2 == 1 ? (tier == 1 ? -152 : -76 * tier) : -76) : status == "available" ? -76 : 0) + "px " + 
                                    (status == "full" ? (tier == 3 ? -76 : (tier == 5 ? -152 : 0) ) : 0) + "px",
							});
				
                // change keystone status
				/*
                var keystoneLink = $(this).data("keystoneLink");
                if (keystoneLink != null) {
                    if ( !keystoneLink.hasClass(status) ) {
                        keystoneLink
                            .removeClass(buttonClasses.join(" "))
                            .addClass(status);
                    }
                }*/
                // force tooltip redraw
                if ($(this).data("hover"))
                    $(this).mouseover();
            })
    );
}

function customTooltip(tooltip, tooltipText) {
    tooltip.addClass("custom");
    tooltip.children(":not(p.first)").hide();
    tooltip.find("p.first").text(tooltipText);
}

function formatTooltip(tooltip, tooltipText) {
    tooltip.removeClass("custom");

    var head = tooltip.find("strong").text(tooltipText.header).show();
    if ( !head.hasClass(treeNames[tooltipText.tree]) ) {
        head
            .removeClass(treeNames.join(" "))
            .addClass(treeNames[tooltipText.tree]);
    }

    var rank = tooltip.find(".rank").text(tooltipText.rank).show();
    if ( !rank.hasClass(tooltipText.rankClass) ) {
        rank
            .removeClass(rankClasses.join(" "))
            .addClass(tooltipText.rankClass)
    }

    tooltip.find(".req").text(tooltipText.req).show();
    tooltip.find("p.first").html(tooltipText.body);

    var second = tooltip.find("p.second");
    if (tooltipText.bodyNext == null) {
        second.hide();
    } else {
        second
            .show()
            .find(".content")
                .html(tooltipText.bodyNext);
    }
}

function masteryTooltip(tree, index, rank) {
    var mastery = data[tree][index];
    // second flags whether there are two tooltips (one for next rank)
    var showNext = !(rank < 1 || rank >= mastery.ranks);

    // parse text
    var text = {
        tree: tree,
        header: mastery.name,
        rank: "Rank: " + rank + "/" + mastery.ranks,
        rankClass: (rank == mastery.ranks ? rankClasses[2] : (isValidState(tree, index, rank, 1) ? rankClasses[1] : rankClasses[0])),
        req: masteryTooltipReq(tree, index),
        body: masteryTooltipBody(mastery, rank),
        bodyNext: showNext ? masteryTooltipBody(mastery, rank+1) : null,
    };

    return text;
}

function masteryTooltipBody(mastery, rank)  {
    // Rank 1 is index 0, but Rank 0 is also index 0
    rank = Math.max(0, rank - 1);
    var desc = mastery.desc;
    desc = desc.replace(/#/, mastery.rankInfo[rank]);
    desc = desc.replace(/\n/g, "<br>");
    desc = desc.replace(/\|(.+?)\|/g, "<span class='highlight'>$1</span>");
    if (mastery.rankInfo2) {
        desc = desc.replace(/#/, mastery.rankInfo2[rank]);
    }
	if (mastery.perLevel) {
        desc = desc.replace(/#/, Math.round(mastery.perLevel[rank]*100)/100);
    }
	if (mastery.perLevel2) {
        desc = desc.replace(/#/, Math.round(mastery.perLevel[rank]*100)/100);
    }
    return desc;
}

function masteryTooltipReq(tree, index) {
    var missing = [];
    var pointReq = masteryPointReq(tree, index)
    if (pointReq > treePoints(tree))
        missing.push("Requires " + pointReq + " point(s) in " + treeNames[tree][0].toUpperCase() + treeNames[tree].slice(1));
    if ((state[tree][index] || 0) < data[tree][index].ranks) {
		var existing = masteryTierFull(tree, index);
		if (existing >= 0) //If we can put more points here, but it will remove points in your current mastery
			missing.push("Choosing this will remove points in " + data[tree][existing].name + ".");
    }

    return missing.join("\n");
}

// L
function masteryButtonPosition(tree, index) {
    var idx = data[tree][index].index - 1;
    var ix = idx % 4;
    var iy = data[tree][index].tier;
    var x = 0, y = 0;
	
    // padding for tree
    x += TREE_OFFSET * tree;
    // base padding
	x += SPACING.margin_left;
    if (iy % 2 == 1 && iy != 5) x += SPACING.margin_keystone;
    y += SPACING.margin_top;
    // padding for spacing
    x += ix * (BUTTON_SIZE + SPACING.spacing_x);
    y += iy * (BUTTON_SIZE + SPACING.spacing_y);

    return {x: x, y: y};
}

function masterySpritePos(tree, index) {
    return 0 - BUTTON_SIZE * (treeOffsets[tree] + index);
}

function masteryTier(tree, index) {
    return data[tree][index].tier;
}

function masteryPointReq(tree, index) {
    return TIER_REQS[masteryTier(tree, index)];
}

// Returns the number of the other mastery in tier if both masteries sum up to the maximum number of points in tier.
function masteryTierFull(tree, index) {
    var tier = data[tree][index].tier;
	for (var i in data[tree])
		if (i != index && data[tree][i].tier == tier && (state[tree][i] || 0) + (state[tree][index] || 0) >= data[tree][i].ranks) 
			return i;
    return -1;
}

function treePoints(tree, treeTier) {
    var points = 0;
    for (var i in state[tree])
        if (!treeTier || treeTier > masteryTier(tree, i))
            points += state[tree][i];
    return points;
}

function isValidState(tree, index, rank, mod) {
    var mastery = data[tree][index];
    if (rank+mod < 0 || rank+mod > mastery.ranks)
        return false;

    // Incrementing
    if (mod > 0) {
        // Check max points
        if (totalPoints + mod > MAX_POINTS)
		{
			// Check if we can add points here by removing them from the alternative mastery
			if (masteryTierFull(tree, index) >= 0)
				return true;
			else
				return false;
		}

        // Check this mastery's rank requirements: never account for current rank
        if (masteryPointReq(tree, index) > treePoints(tree) - rank)
            return false;
    }

    // Decrementing
    if (mod < 0) {
        // Check tree rank requirements
        for (var i in state[tree])
            if (i != index)
                // Figure out tier, get req points
                if (state[tree][i] > 0 && 
                    // Calculate points in this tree up to this tier, and
                    // subtract one if we're removing from this portion
                    masteryPointReq(tree, i) > treePoints(tree, masteryTier(tree, i)) - (masteryTier(tree, index) < masteryTier(tree, i)))
                    return false;

        // Check child requirements
        for (var i in state[tree])
            if (i != index)
                if (state[tree][i] > 0 && data[tree][i].parent == index)
                    return false;
    }

    return true;
}

function setState(tree, index, rank, mod) {
    state[tree][index] = rank + mod;
    totalPoints += mod;

    updateButtons();
    updateLabels();
	if (MUSIC) updateMusic();
    updateLink();
}

// If quiet flag is true, does not call updates
function resetStates(quiet) {
    for (var tree=0; tree<3; tree++)
        resetTree(tree);

    if (quiet != true) {
        updateButtons();
        updateLabels();
		if (MUSIC) updateMusic();
        updateLink();
		if (MUSIC) sounds_return.play();
    }
}

// Used in both resetStates and via panel
function resetTree(tree, update) {
    totalPoints -= treePoints(tree);
    for (var index in state[tree])
        state[tree][index] = 0;
}

function updateButtons() {
    $("#calculator .button").each(function(){
        $(this).data("update").call(this, 0);
    });
}

function updateLabels() {
    for (var tree=0; tree<3; tree++) {
        $("div[data-idx="+tree+"]").text(treeNames[tree] + ": " + treePoints(tree));
        $("#points>.count").text(MAX_POINTS - totalPoints);
    }
}

function updateLink() {
    var hash = exportMasteries();
    // Do not show link for empty trees
    if (hash.length <= 3) hash = '';
    hash = '#' + hash;

    // Update link and url only if we have to
    $("#exportLink").attr("href", document.location.pathname + hash);
    if (document.location.hash != hash) {
        // Using replace() causes no change in browser history
        document.location.replace(hash);
        // Temporarily unbind change
        $(window).unbind('hashchange');
        setTimeout(function(){
            $(window).bind('hashchange', updateMasteries);
        }, 500);
    }
}

// There are max 4 points per mastery, or 3 bits each. There is a 1 bit padding
// that is a flag to determine whether the following 5 bits are a sequence of
// mastery codes or an index increase. We greedily take masteries until the next
// one would put us over capacity, at which point we flush the buffer. You will
// always flush at the end of a tree.
var maxbits = 5;
var exportChars = "WvlgUCsA7pGZ3zSjakbP2x0mTB6htH8JuKMq1yrnwEQDLY5IVNXdcioe9fF4OR_-";
var bitlen = function(tree, index) {
    if (data[tree][index] == undefined)
        return 0;
    return Math.floor(data[tree][index].ranks/2)+1;
}
// returns how many of the next masteries can fit in size bits
var bitfit = function(tree, index, bits) {
    var start = index;
    while (true) {
        var len = bitlen(tree, index);
        if (len > bits || len == 0)
            return index - start;
        bits -= len;
        index++;
    }
}
function exportMasteries() {
    var str = "";
    var bits = 0;
    var collected = 0; // number of bits collected in this substr
    var tree, jumpStart = -1; // jumpStart is the start of the index, which we can turn to a bool by comparing >-1
    var flush = function() {
        str += exportChars[(jumpStart>-1) << maxbits | bits];
        bits = 0;
        collected = 0;
        jumpStart = -1;
    }
    for (tree = 0; tree < 3; tree++) {
        for (var index = 0; index < data[tree].length; index++) {
            var space = bitfit(tree, index, maxbits - collected);

            // check if we should flush
            if (space < 1) {
                flush();
                space = bitfit(tree, index, maxbits);
            }

            // if we are collecting or the condition is right for collecting:
            // - if we are jumping and this is 0, SKIP. 
            if (jumpStart > -1 && !(state[tree][index] > 0))
                continue;
            // otherwise:
            // - either we were collecting already (and haven't flushed)
            // - or we can collect any within the next subset that would fit in
            //   this bit. we do this with some cool filter/map/reduce
            if (collected > 0 || 
                [0,1,2,3,4]
                    .filter(function(a){ return a < space; })
                    .map(function(a){ return state[tree][index+a] || 0; })
                    .some(function(a){ return a > 0; })){
                // check if we are at the end of a jump
                if (jumpStart > -1) {
                    bits = index - jumpStart;
                    flush();
                }
                    
                // collect more
                var len = bitlen(tree, index);
                bits = (bits << len) | (state[tree][index] || 0);
                collected += len;
            } else if(jumpStart < 0) {
                // this is the start of a jump
                // check for flush
                if (collected > 0)
                    flush();
                jumpStart = index;
            }
        }
        // before switching trees, flush unless we just did
        if (jumpStart > -1) {
            bits = index - jumpStart;
            flush();
        } else if (collected > 0) {
            flush();
        }
    }

    return str;
}

// Because we used a random string, we need to reverse it
var importChars = {}
for (var i=0; i<exportChars.length; i++) {
    importChars[exportChars[i]] = i;
}
function importMasteries(str) {
    resetStates(true);

    var tree = 0;
    var index = 0;
    for (var i=0; i<str.length; i++) {
        var cur = importChars[str[i]];
        // check for bad input
        if (cur == undefined) 
            return;
        // if the first bit is a 0, we know it's not a jump (using octal)
        if ((cur & 040) == 0) {
            // extract data
            var num = bitfit(tree, index, maxbits); // how many we can fit
            var sizes = [0, 1, 2, 3, 4] // an array of each mastery held in this char
                            .filter(function(a){ return a < num; })
                            .map(function(a){ return bitlen(tree, index+a); });
            for (var j=0; j<sizes.length; j++, index++) {
                // shift amount is the sum of all elements to the right of this one
                var shift = sizes.slice(j + 1).reduce(function(a, b){ return a + b; }, 0);
                // shift off the bits we don't want and AND it with a bit mask
                var value = (cur >> shift) & ((1 << sizes[j]) - 1);

                state[tree][index] = value;
                totalPoints += value;
            }
        } else {
            // jump
            var dist = cur & 037;
            index += dist;
        }

        // increment when we're done with a tree
        if (index >= data[tree].length) {
            tree++;
            index = 0;
            // break when we're done with all trees
            if (tree >= data.length)
                break;
        }
    }

    updateButtons();
    updateLabels();
	if (MUSIC) updateMusic();
    updateLink();
}

function updateMasteries() {
    importMasteries(document.location.hash.slice(1));
}



$(function(){
    // Calculator
    drawCalculator();

    // Panel
    $("#return").click(resetStates);
    for (var tree = 0; tree < 3; tree++) {
        $("#panel>#tree-summaries").append(
            $("<div>")
                .addClass("tree-summary")
                .addClass(treeNames[tree])
                .attr("data-idx", tree)
                .text(0)
                .css({
                    left: TREE_OFFSET * tree + 100,
                    cursor: "pointer",
                })
                .mouseover(function(){
                    customTooltip($("#tooltip").show(), "Double click to reset tree");
                })
                .mouseout(function(){
                    $("#tooltip").hide();
                })
                .dblclick(function(){
                    resetTree($(this).attr("data-idx"), true);
					if (MUSIC) action_sound = sounds_return;
                    updateButtons();
                    updateLabels();
					if (MUSIC) updateMusic();
                    updateLink();
                })
        )
        .append(
            $("<div>")
        );
    }
		
    // Once set up, load if hash present
    if (document.location.hash != "")
        updateMasteries();

    // Listen for hash changes
    $(window).bind('hashchange', updateMasteries);
});