const DEBUG = true

const clientSystem = client.registerSystem(0, 0)

clientSystem.initialize = function () {
  this.listenForEvent('minimap:update_block', event => this.onUpdateBlock(event.data.blocks, event.data.yaw))
  this.listenForEvent('minimap:update_coord', event => this.onUpdateCoord(event.data.x, event.data.y, event.data.z))

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

// Hooks --------------------------------------------------

clientSystem.update = function () {

}

clientSystem.onUpdateBlock = function (blocks, yaw) {
  let eventData = this.createEventData('minecraft:send_ui_event')
  eventData.data.eventIdentifier = 'update_minimap'

  let data = {
    data_str: blocks,
    yaw: yaw
  }
  eventData.data.data = JSON.stringify(data)

  this.broadcastEvent('minecraft:send_ui_event', eventData)
}

clientSystem.onUpdateCoord = function (x, y, z) {
  let eventData = this.createEventData('minecraft:send_ui_event')
  eventData.data.eventIdentifier = 'update_coord'

  let data = {
    x: (x > 0 ? '+' : '') + Math.round(x),
    y: Math.round(y),
    z: (z > 0 ? '+' : '') + Math.round(z)
  }
  eventData.data.data = JSON.stringify(data)

  this.broadcastEvent('minecraft:send_ui_event', eventData)
}

clientSystem.onWorldLoaded = function (player) {
  showMinimap()

  this.showMessage('Minimap Add-ons by SuYong')
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
