const DEBUG = true

const clientSystem = client.registerSystem(0, 0)

clientSystem.initialize = function () {
  this.registerEventData('minimap:client_loaded', { nothing: null }) // without parameter, script crashed

  this.listenForEvent('minimap:update_block', event => this.onUpdateBlock(event.data.blocks, event.data.name))
  this.listenForEvent('minimap:update_coord', event => this.onUpdateCoord(event.data.x, event.data.y, event.data.z, event.data.yaw, event.data.name))
  this.listenForEvent('minimap:player_entered', event => this.onClientPlayer(event.data.player, event.data.name))

  this.listenForEvent('minecraft:ui_event', event => this.onUIEvent(JSON.parse(event.data).id, JSON.parse(event.data).data))
  this.listenForEvent('minecraft:client_entered_world', event => this.onWorldLoaded(event.data.player))


  if (DEBUG) {
    let debug_config = this.createEventData('minecraft:script_logger_config')
    debug_config.data.log_errors = true
    debug_config.data.log_warnings = true
    debug_config.data.log_information = true

    this.broadcastEvent('minecraft:script_logger_config', debug_config)
  }
}

// Define variables --------------------------------------------------

let ME = null
let NAME = ''

// Hooks --------------------------------------------------

clientSystem.update = function () {

}

clientSystem.onUpdateBlock = function (blocks, name) {
  if(NAME != name) {
    return
  }

  let eventData = this.createEventData('minecraft:send_ui_event')
  eventData.data.eventIdentifier = 'update_minimap'

  let data = { data_str: blocks }
  eventData.data.data = JSON.stringify(data)

  this.broadcastEvent('minecraft:send_ui_event', eventData)
}

clientSystem.onUpdateCoord = function (x, y, z, yaw, name) {
  if(NAME != name) {
    return
  }

  let eventData = this.createEventData('minecraft:send_ui_event')
  eventData.data.eventIdentifier = 'update_coord'

  eventData.data.data = JSON.stringify({ x: x, y: y, z: z, yaw: yaw })

  this.broadcastEvent('minecraft:send_ui_event', eventData)
}

clientSystem.onWorldLoaded = function (player) {
  showMinimap()

  let event = this.createEventData('minimap:client_loaded')
  event.data.nothing = null 
  this.broadcastEvent('minimap:client_loaded', event)

  this.showMessage('Minimap Add-ons by SuYong')
}

clientSystem.onClientPlayer = function (player, name) {
  if (NAME == '' || ME == null) {
    ME = player
    NAME = name
  }
}

clientSystem.onDestryBlock = function (event) {

}

clientSystem.onUIEvent = function (id, data) {
  switch (id) {
    case 'debug_show_message':
      this.showMessage(data.message)
      break
    case 'open_setting':
      dismissMinimap()
      showSetting()
      break
    case 'close_setting':
      dismissSetting()
      showMinimap()
      break
  }
}

function showMinimap() {
  let loadData = clientSystem.createEventData('minecraft:load_ui')
  loadData.data.path = 'minimap.html'
  loadData.data.options = {
    always_accepts_input: false,

    render_game_behind: true,
    absorbs_input: false,
    is_showing_menu: false,
    should_steal_mouse: true,
    force_render_below: true,

    render_only_when_topmost: false,
  }

  clientSystem.broadcastEvent('minecraft:load_ui', loadData)
}

function showSetting() {
  let loadData = clientSystem.createEventData('minecraft:load_ui')
  loadData.data.path = 'setting.html'
  loadData.data.options = {
    always_accepts_input: true,

    render_game_behind: true,
    absorbs_input: true,
    is_showing_menu: true,
    should_steal_mouse: false,
    force_render_below: false,

    render_only_when_topmost: false,
  }

  clientSystem.broadcastEvent('minecraft:load_ui', loadData)
}

function dismissMinimap() {
  let data = clientSystem.createEventData('minecraft:unload_ui')
  data.data.path = 'minimap.html'

  clientSystem.broadcastEvent('minecraft:unload_ui', data)
}

function dismissSetting() {
  let data = clientSystem.createEventData('minecraft:unload_ui')
  data.data.path = 'setting.html'

  clientSystem.broadcastEvent('minecraft:unload_ui', data)
}

// Custom Funcitons --------------------------------------------------

clientSystem.showMessage = function (message) {
  let eventData = this.createEventData('minecraft:display_chat_event')
  eventData.data.message = message
  this.broadcastEvent('minecraft:display_chat_event', eventData)
}
