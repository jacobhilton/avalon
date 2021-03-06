function Avalon(players, special){
  this.players = players;
  special["the Assassin"] = special["Merlin"] || special["Snape"];
  this.special = special;
  this.evilPlayers = ({
    4:  1,
    5:  2,
    6:  2,
    7:  3,
    8:  3,
    9:  3,
    10: 4
  })[players];
  this.goodPlayers = this.players - this.evilPlayers;
  this.evilSpecial = ["the Assassin", "Morgana", "Mordred", "Oberon", "Snape"].filter(function(identity){
    return special[identity];
  });
  this.goodSpecial = ["Merlin", "Percival"].filter(function(identity){
    return special[identity];
  });
  this.allQuests = ({
    4:  ["2", "3", "2", "3", "3"],
    5:  ["2", "3", "2", "3", "3"],
    6:  ["2", "3", "4", "3", "4"],
    7:  ["2", "3", "3", "4 (two fails required)", "4"],
    8:  ["3", "4", "4", "5 (two fails required)", "5"],
    9:  ["3", "4", "4", "5 (two fails required)", "5"],
    10: ["3", "4", "4", "5 (two fails required)", "5"]
  })[players];
  this.largestQuests = ({
    4:  ["3", " 3", " 3"],
    5:  ["3", " 3", " 3"],
    6:  ["3", " 4", " 4"],
    7:  ["3", " 3", " 4"],
    8:  ["4", " 4", " 5"],
    9:  ["4", " 4", " 5"],
    10: ["4", " 4", " 5"]
  })[players];

  this.getRoles = function(){
    var roles = [];
    for(var i = 0; i < this.evilPlayers; i++){
      roles.push({"side": "evil", "identity": (i < this.evilSpecial.length ? this.evilSpecial[i] : false)});
    }
    for(var i = 0; i < this.goodPlayers; i++){
      roles.push({"side": "good", "identity": (i < this.goodSpecial.length ? this.goodSpecial[i] : false)});
    }
    return roles.map(function(role){
      role["random"] = Math.random();
      return role;
    }).sort(function(a, b){
      return a["random"] - b["random"];
    }).map(function(role, i){
      delete role["random"];
      role["number"] = i + 1;
      return role;
    });
  };

  function joinCommasAnd(l){
    return [l.slice(0, -1).join(", "), l.slice(-1)[0]].join(l.length <= 1 ? "" : " and ");
  };

  this.getRevealText = function(roles, role){
    if(role["side"] == "evil" && role["identity"] != "Oberon"){
      var revealed = roles.filter(function(otherRole){
        return otherRole["side"] == "evil" && otherRole["identity"] != "Oberon" && otherRole["number"] != role["number"];
      }).map(function(otherRole){
        return otherRole["number"];
      });
      if(revealed.length == 1){
        return "Player " + revealed[0] + " is also evil.";
      }
      if(revealed.length >= 2){
        return "Players " + joinCommasAnd(revealed) + " are also evil.";
      }
    }
    if(role["identity"] == "Merlin"){
      var revealed = roles.filter(function(otherRole){
        return otherRole["side"] == "evil" && otherRole["identity"] != "Mordred";
      }).map(function(otherRole){
        return otherRole["number"];
      });
      if(revealed.length == 1){
        return "Player " + revealed[0] + " is evil.";
      }
      if(revealed.length >= 2){
        return "Players " + joinCommasAnd(revealed) + " are evil.";
      }
    }
    if(role["identity"] == "Percival"){
      var revealed = roles.filter(function(otherRole){
        return otherRole["identity"] == "Merlin" || otherRole["identity"] == "Morgana";
      }).map(function(otherRole){
        return otherRole["number"];
      });
      if(revealed.length == 1 && this.special["Merlin"]){
        return "Player " + revealed[0] + " is Merlin.";
      }
      if(revealed.length == 2){
        return "Players " + joinCommasAnd(revealed) + " are Merlin and Morgana in some order.";
      }
    }
    return false;
  };

  this.getScript = function(){
    if(this.evilSpecial.length > this.evilPlayers){
      return [["Too many evil special characters. Please try again."], []];
    }
    if(this.goodSpecial.length > this.goodPlayers){
      return [["Too many good special characters. Please try again."], []];
    }
    var roles = this.getRoles();
    var script = [];
    for(var i = 0; i < this.players; i++){
      script.push(["Pass to Player " + roles[i]["number"] + "."]);
      var identityText = roles[i]["identity"] == false ? roles[i]["side"] : roles[i]["identity"] + " (" + roles[i]["side"] + ")";
      var revealText = this.getRevealText(roles, roles[i]);
      var scriptLine = [];
      scriptLine.push("Player " + roles[i]["number"] + ", you are " + identityText + ".");
      if(revealText != false){
        scriptLine.push(revealText);
      }
      scriptLine.push("Click to continue.");
      script.push(scriptLine);
    }
    var summaryLine = [
      "There are " + this.goodPlayers + " good players" + (this.goodSpecial.length > 0 ? ", including " + joinCommasAnd(this.goodSpecial) : "") + ".",
      "There are " + this.evilPlayers + " evil players" + (this.evilSpecial.length > 0 ? ", including " + joinCommasAnd(this.evilSpecial) : "") + ".",
      "The numbers of players on each quest are " + joinCommasAnd(this.allQuests) + ".",
      "The numbers of players on the three largest quests are " + joinCommasAnd(this.largestQuests) + "."
    ];
    script.push(summaryLine.concat(["Click to reveal a random permutation of the players."]));
    var permutation = roles.map(function(_, i){
      return {"number": i + 1, "random": Math.random()};
    }).sort(function(a, b){
      return a["random"] - b["random"];
    }).map(function(x){
      return x["number"];
    });
    script.push(summaryLine.concat([permutation.join(", ")]));
    return script;
  };

  this.script = this.getScript();
  this.scriptPosition = 0;

  this.next = function(){
    return this.script[this.scriptPosition++ % this.script.length];
  };
};

document.addEventListener("DOMContentLoaded", function(){
  var avalon;

  function next(){
    var messages = avalon.next();
    var messageInputs = document.getElementsByClassName("message");
    for(var i = 0; i < messageInputs.length; i++){
      var messageNumber = messageInputs[i].id.split("message")[1] * 1;
      if(messageNumber < messages.length){
        messageInputs[i].style.display = "block";
        messageInputs[i].textContent = messages[messageNumber];
      }
      else{
        messageInputs[i].style.display = "none";
        messageInputs[i].textContent = "";       
      }
    }
    if(messages.length == 0){
      document.getElementById("form").style.display = "block";
      document.getElementById("result").style.display = "none";
    }
  };

  document.getElementById("continue").addEventListener("click", next);

  document.getElementById("submit").addEventListener("click", function(){
    var players = document.getElementById("players").value * 1;
    var specialInputs = document.getElementsByClassName("special");
    var special = {};
    for(var i = 0; i < specialInputs.length; i++){
      special[specialInputs[i].id] = specialInputs[i].checked;
    }
    avalon = new Avalon(players, special);
    document.getElementById("form").style.display = "none";
    document.getElementById("result").style.display = "block";
    next();
  });
});
