// Suppress unhandled promise rejections from Vue reactivity in happy-dom
process.on('unhandledRejection', (reason) => {
  // Suppress DOM-related errors from Vue in happy-dom environment
  if (
    reason instanceof TypeError &&
    (reason.message.includes('parent.insertBefore is not a function') ||
     reason.message.includes('el.addEventListener is not a function') ||
     reason.message.includes("Cannot set properties of null (setting '__vnode')"))
  ) {
    // Silently ignore these known happy-dom + Vue reactivity issues
    return
  }
  // Re-throw other unhandled rejections
  throw reason
})
