const DEBUG = true

const serverSystem = server.registerSystem(0, 0)

serverSystem.initialize = function () {
  this.registerEventData('minimap:update_block', { blocks: [] })
  this.registerEventData('minimap:update_coord', { x: 0, y: 0, z: 0 })
  this.registerEventData('minimap:entity_created', { position: [], entity: null })

  this.listenForEvent('minecraft:entity_created', event => this.onEntityCreated(event.data.entity))
  this.listenForEvent('minecraft:entity_tick', event => this.onEntityTicked(event.data.entity))

  if (DEBUG) {
    let debug_config = this.createEventData('minecraft:script_logger_config')
    debug_config.data.log_errors = true
    debug_config.data.log_warnings = true
    debug_config.data.log_information = true

    this.broadcastEvent('minecraft:script_logger_config', debug_config)
  }
}

// Define variables --------------------------------------------------

let cool = 100
let players = []
let old_pos = []

let blocks = ''
let tickingArea = null

// algorithms --------------------------------------------------

function getBlocks(tickingArea, x, y, z) {
  let size = 10
  let ysize = 3
  let result = ''
  for (let xi = size; xi > -size; xi--) {
    for (let zi = -size; zi < size; zi++) {
      yloop: for (let yi = ysize; yi > -ysize; yi--) {
        let block = serverSystem.getBlock(tickingArea, x + xi, y + yi, z + zi).__identifier__
        if(block != 'minecraft:air') {
          result += colorize(block)
          break yloop
        }
      }
    }
  }

  return result
}

/*
rotation y
-180 ~ 180
       +z
       0
+x -90   +90
    +-180
*/

// Hooks --------------------------------------------------

serverSystem.update = function () {
  if (players.length > 0) {
    let pos = this.getComponent(players[0], 'minecraft:position').data
    if (tickingArea == null) {
      tickingArea = this.getComponent(players[0], 'minecraft:tick_world').data.ticking_area
    }

    if (cool <= 0) {
      let event = this.createEventData('minimap:update_block')
      //event.data.blocks = getBlocks(tickingArea, pos.x, pos.y - 1, pos.z)
      event.data.blocks = normalize(this.getBlocks(tickingArea, pos.x - 10, pos.y - 1, pos.z - 10, pos.x + 10, pos.y - 1, pos.z + 10))
      event.data.yaw = this.getComponent(players[0], 'minecraft:rotation').data.y

      this.broadcastEvent('minimap:update_block', event)

      let eventCoord = this.createEventData('minimap:update_coord')
      
      eventCoord.data.x = pos.x
      eventCoord.data.y = pos.y
      eventCoord.data.z = pos.z
      
      this.broadcastEvent('minimap:update_coord', eventCoord)
      cool = 4
    }

    cool--
  }
}

/**
 * entity ticked
 * @param entity {Entity}
 */
serverSystem.onEntityTicked = function (entity) {
  
}

/**
 * entity created
 * @param entity {Entity} 
 */
serverSystem.onEntityCreated = function (entity) {
  if (entity.__identifier__ == 'minecraft:player') {
    players.push(entity)
  }
}

// Custom Funcitons --------------------------------------------------

/**
 * show message
 * @param message {String} 
 */
serverSystem.showMessage = function (message) {
  let eventData = this.createEventData('minecraft:display_chat_event')
  eventData.data.message = message
  this.broadcastEvent('minecraft:display_chat_event', eventData)
}

/**
 * translate from block array to string
 * @param blockArray {Array}
 * @return colorCodes {String}
 */
function normalize(array) {
  let result = ''
  // let open = false

  for (let x in array) {
    for (let z in array[x][0]) {
      let code = colorize(array[20 - x][0][z].__identifier__)
      result += code
      /*if (open) {
        let str = result.split('[')
        let c1 = str[str.length - 1]
        let num = str[str.length - 2]

        if (code == c1) {
          str.pop()
          str.push(num + 1)
          result = str.join('[')
        } else {
          open = false
          result += ']' + code
        }
      } else if (code == result[result.length - 1]) {
        open = true
        result += '[2'
      } else {
        result += code
      }*/
    }
  }

  return result
}

/**
 * change identifier to number
 * @param blockIdentifier {String}
 * @return colorCode {Number}
 */
function colorize(name) {
  switch (name) {
    case 'minecraft:grass':
      return 0//'#7FB238'
    case 'minecraft:stone': case 'minecraft:cobblestone':
      return 1//'#707070'
    case 'minecraft:sand':
      return 2//'#F7E9A3'
    case 'minecraft:dirt':
      return 3//'#976D4D'
    case 'minecraft:water':
      return 4//'#4040FF'
    default:
      return 5//'#FFFFFF'
  }
}