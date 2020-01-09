const DEBUG = true

const serverSystem = server.registerSystem(0, 0)

serverSystem.initialize = function () {
  this.registerEventData('minimap:update_block', { blocks: '', name: '' })
  this.registerEventData('minimap:update_coord', { x: 0, y: 0, z: 0, yaw: 0, name: '' })
  this.registerEventData('minimap:entity_created', { position: [], entity: null })
  this.registerEventData('minimap:player_entered', { player: null, name: '' })

  this.listenForEvent('minimap:client_loaded', event => this.onClientLoaded())

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
        if (block != 'minecraft:air') {
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
  for (let i in players) {
    let pos = this.getComponent(players[i], 'minecraft:position').data
    if (tickingArea == null) {
      tickingArea = this.getComponent(players[i], 'minecraft:tick_world').data.ticking_area
    }

    let eventCoord = this.createEventData('minimap:update_coord')

    eventCoord.data.x = pos.x
    eventCoord.data.y = pos.y
    eventCoord.data.z = pos.z
    eventCoord.data.yaw = this.getComponent(players[i], 'minecraft:rotation').data.y
    eventCoord.data.name = this.getComponent(players[i], 'minecraft:nameable').data.name

    this.broadcastEvent('minimap:update_coord', eventCoord)

    if (cool <= 0) {
      let event = this.createEventData('minimap:update_block')

      event.data.blocks = normalize(this.getBlocks(tickingArea, pos.x - 10, pos.y - 1, pos.z - 10, pos.x + 10, pos.y - 1, pos.z + 10))
      event.data.name = this.getComponent(players[i], 'minecraft:nameable').data.name

      this.broadcastEvent('minimap:update_block', event)
    }
  }

  cool--
  if (cool < 0) {
    cool = 20
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
    this.showMessage('add player : ' + players.lenegth)
  }
}

/**
 * new player loaded
 */
serverSystem.onClientLoaded = function () {
  let event = this.createEventData('minimap:player_entered')

  event.data.player = players[players.length - 1]
  event.data.name = this.getComponent(players[players.length - 1], 'minecraft:nameable').data.name

  this.broadcastEvent('minimap:player_entered', event)
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
  switch (name.split(':')[1]) {
    case 'grass': case 'slime':
      return 0//'#7FB238'
    case 'stone': case 'cobblestone': case 'mossy_cobblestone':
    case 'stone_slab': case 'double_stone_slab': case 'mossy_cobblestone_slab': case 'double_mossy_cobblestone_slab':
    case 'stone_stairs': case 'andesite_stairs': case 'normal_stone_stairs':
    case 'bedrock':
    case 'gold_ore': case 'iron_ore': case 'coal_ore': case 'lapis_ore':
    case 'dispenser':
      return 1//'#707070'
    case 'sand':
      return 2//'#F7E9A3'
    case 'dirt':
      return 3//'#976D4D'
    case 'water': case 'kelp': case 'seagrass':
      return 4//'#4040FF'
    default:
      return 5//'#FFFFFF'
  }
}