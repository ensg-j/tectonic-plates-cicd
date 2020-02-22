//Affichage globe
var wwd = new WorldWind.WorldWindow("canvasOne");
wwd.addLayer(new WorldWind.BMNGOneImageLayer());
wwd.addLayer(new WorldWind.BMNGLandsatLayer());

//Compas et autres boutons
wwd.addLayer(new WorldWind.ViewControlsLayer(wwd));
wwd.navigator.range = 2e7;

//Couches visibles
var shapesLayer = new WorldWind.RenderableLayer("Surface Shapes");
wwd.addLayer(shapesLayer);

axes_rotation = [];//Array contenant tous les axes de rotation
plaques = []; //Array contenant toutes les plaques


fetch('currentfile.geojson')
.then(result => result.json())
.then(function(resp){
  var n =resp.features.length; // On récupère le nombre de polygones

  for (i = 0; i < n; i++) {// Pour chaque polygone
    //On recherche son axe de rotation
    var axe_rotation = []; //Liste des coordonnées de l'axe de rotation
    var lat = resp.features[i].properties.latPE; // Récupération de la latitude du point
    var lng = resp.features[i].properties.lngPE; // Récupération de la longitude du point

    //On créer une couche correspondant à l'axe de rotation
    var AxeLayer = new WorldWind.RenderableLayer();
    wwd.addLayer(AxeLayer);

    //Création des attributs graphiques de l'axe de rotation
    var axeAttributes = new WorldWind.ShapeAttributes(null);
    axeAttributes.interiorColor = WorldWind.Color.RED;  // On choisir un axe rouge
    axeAttributes.outlineColor = WorldWind.Color.RED;
    axeAttributes.drawOutline = true;
    axeAttributes.applyLighting = true;

    // Approximation du cercle par un octogone avec pour centre le point
    axe_rotation.push(new WorldWind.Position(lng,lat+0.125, 1000000000.0));
    axe_rotation.push(new WorldWind.Position(lng+0.0875,lat+0.0875, 1000000000.0));
    axe_rotation.push(new WorldWind.Position(lng+0.125,lat, 1000000.0));
    axe_rotation.push(new WorldWind.Position(lng+0.0875,lat-0.0875, 1000000000.0));
    axe_rotation.push(new WorldWind.Position(lng,lat-0.125, 1000000.0));
    axe_rotation.push(new WorldWind.Position(lng-0.0875,lat-0.0875, 1000000000.0));
    axe_rotation.push(new WorldWind.Position(lng-0.125,lat, 1000000.0));
    axe_rotation.push(new WorldWind.Position(lng-0.0875,lat+0.0875, 1000000000.0));

    var axe= new WorldWind.Polygon(axe_rotation, axeAttributes); // Création de l'axe comme decaédre
    axe.extrude = true;
    AxeLayer.addRenderable(axe);
    axe.enabled = false;// On n'affiche pas l'axe de rotation
    axes_rotation.push(axe);


    var n_coord = resp.features[i].geometry.coordinates[0][0].length; // Nombre de coordonnées du polygone de la plaque

    boundaries = [] // Array contenant les limites du polygone
    for (j=0; j<n_coord;j++){
      // On ajoute dans la liste tous les coordonnées qui forment le polygone
      boundaries.push(new WorldWind.Location(resp.features[i].geometry.coordinates[0][0][j][1],resp.features[i].geometry.coordinates[0][0][j][0]));
    }

    //Définition attributs des polygones
    // Attributs généraux
    var attributes = new WorldWind.ShapeAttributes(null); // Création du style
    attributes.outlineWidth = 2; // Taille du trait
    // On choisit une couleur au hasard, on met en transparence à 0.5
    attributes.interiorColor = new WorldWind.Color(0.375 + 0.5 * Math.random(),0.375 + 0.5 * Math.random(),0.375 + 0.5 * Math.random(),
                0.5);
    // On choisit la même couleur que précedemment et on la rend plus foncée pour qu'elle soit plus visible
    attributes.outlineColor = new WorldWind.Color(0.5 * attributes.interiorColor.red,0.5 * attributes.interiorColor.green,0.5 * attributes.interiorColor.blue,
                1.0);

    //Attributs au click
    var attributes_highlight = new WorldWind.ShapeAttributes(null); // Création du style
    // On récupère les mêmes couleurs
    attributes_highlight.outlineColor = WorldWind.Color.RED;
    attributes_highlight.interiorColor = attributes.interiorColor;
    attributes_highlight.outlineWidth = 10; // Taille du trait grosse

    //Création de la plaque
    var plaque = new WorldWind.SurfacePolygon(boundaries, attributes); // On lui attribut les attributs définis si-dessus
    plaque.highlightAttributes = attributes_highlight;
    plaque.displayName=i; // Correspond au numéro du point correspondant à son axe de rotation
    shapesLayer.addRenderable(plaque);
    plaques.push(plaque);

  }
})


wwd.deepPicking = true; // On va choisir des éléments

// Elements cliqués
var highlightedItems = [];

// Fonction qui sera lancée au click sur une plaque : Elle affiche les contours et l'axe de rotation
function selection (ev) {
 var date2 = new Date().getTime();
 if (date2-Date1<500){// Si c'est un click simple et pas un click long/drag
    var x = ev.clientX, y = ev.clientY; // On récupère l'emplacement du click de la souris
    var redrawRequired = highlightedItems.length > 0; // A t-on déjà cliqué des éléments ? Sera t-il donc nécessaire de recharger la page ?

    for (var h = 0; h < highlightedItems.length; h++) { // Si oui, on déselectionne les élements précédemment sélectionnés
        highlightedItems[h].highlighted = false;
    }
    highlightedItems = []; // On vide la liste

    for (var a=0; a<axes_rotation.length;a++){// On fait disparaître tous les axes de rotation
      axes_rotation[a].enabled = false;
    }

    //On récupère les objets selectionner
    var pickList = wwd.pick(wwd.canvasCoordinates(x, y));
    if (pickList.objects.length > 0) {// Si des objets ont été selectionnés, il faudra recharger la page
        redrawRequired = true;
    }

    // On selectionner les objet en question
    if (pickList.objects.length > 0) {
        for (var p = 1; p < pickList.objects.length; p++) {
          axes_rotation[pickList.objects[p].userObject.displayName].enabled = true; // On affiche l'axe de rotation de l'objet selectionner
          // On récupère les coordonnées de l'axe de rotation
          var lat_axe = axes_rotation[pickList.objects[p].userObject.displayName].referencePosition.latitude;
          var lng_axe = axes_rotation[pickList.objects[p].userObject.displayName].referencePosition.longitude - 0.125;
          animation(lat_axe,lng_axe);
          //wwd.navigator.lookAtLocation.latitude = axes_rotation[pickList.objects[p].userObject.displayName].referencePosition.latitude;
          //wwd.navigator.lookAtLocation.longitude = axes_rotation[pickList.objects[p].userObject.displayName].referencePosition.longitude - 0.125;
          pickList.objects[p].userObject.highlighted = true; // On affiche l'axe de rotation

          // On ajoute l'élement selectionner à la liste pour pouvoir le deselectionner plus tard
          highlightedItems.push(pickList.objects[p].userObject);
        }
    }

    if (redrawRequired) { // Si un élément a été selectionner
        wwd.redraw(); // On recharge le globe
    }
}
};

//Fonction permettant de deselectionner toutes plaques
function deselection() {
  for (var h = 0; h < highlightedItems.length; h++) { // On déselectionne les plaques sélectionnés
      highlightedItems[h].highlighted = false;}
  for (var a=0; a<axes_rotation.length;a++){// On fait disparaître tous les axes de rotation
    axes_rotation[a].enabled = false;}
}

// Fonction affichant tous les axes de rotation
function affichae_axes_rotation() {
  for (var p = 0; p < axes_rotation.length; p++) {// On parcours la liste des axes de rotation
    axes_rotation[p].enabled = true;// On active l'affichage
    wwd.redraw();// On met à jour le globe
  }

}

//Lorsqu'on clique sur le globe.
var Date1 = 0; // On enregistre la date du premier click
function startCounting(ev){
  Date1 = new Date().getTime();
}

// On ajoute des événements à surveiller
wwd.addEventListener("mousedown",startCounting);// Quand on appuie sur le bouton de la souris, on compte le temps d'appui
wwd.addEventListener("mouseup",selection); // Quand on relache le bouton, on lance la fonction d'affichage des contours de la plaque cliquée et son axe de rotation


function animation (x2,y2) {
  // Fonction qui réalise l'animation de la rotation de la sphère
  var diffx = wwd.navigator.lookAtLocation.latitude-x2; var rapx = diffx/100000;
  var diffy = wwd.navigator.lookAtLocation.longitude-y2; var rapy = diffy/100000;

  for (var count=1;count<100000;count++){ // On replace le point de vue 100000 fois
    setTimeout(function(){wwd.navigator.lookAtLocation.latitude = wwd.navigator.lookAtLocation.latitude - rapx;
    wwd.navigator.lookAtLocation.longitude = wwd.navigator.lookAtLocation.longitude - rapy;
    wwd.redraw(); }, 200);

  }
}


//Gestion de la navigation sur le côté
function openNav() {// On ouvre la navigation
  document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {// On ferme la navigation
  document.getElementById("mySidenav").style.width = "0";
}
