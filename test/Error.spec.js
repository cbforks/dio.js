describe('Error', () => {
	it('should catch an invalid render error', (done) => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			componentDidCatch(err) {
				err.preventDefault()
				stack.push(err)
			}
			render() {
				return h('!invalid')
			}
		}, container)

		nextTick(() => {
			assert.lengthOf(stack, 1)
			done()
		})
	})

	it('should unmount a corrupted tree', (done) => {
		let container = document.createElement('div')

		render(class A {
			componentDidCatch(err) {
				err.preventDefault()
			}
			render() {
				return class B {
					render() {
						throw new Error('error!')
					}
				}
			}
		}, container)

		nextTick(() => {
			assert.html(container, '')
			done()
		})
	})

	it('should unmount when an error is thrown in componentDidCatch', (done) => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			componentDidCatch(err, {errorMessage}) {
				err.preventDefault()
				stack.push(errorMessage.indexOf('componentDidCatch') > -1)
			}
			render() {
				return class {
					componentDidCatch(err) {
						throw err
					}
					render() {
						throw new Error('Error!')
					}
				}
			}
		}, container)

		nextTick(() => {
			assert.html(container, '')
			assert.include(stack, true)
			done()
		})
	})

	it('should recover from an async element error', (done) => {
		let container = document.createElement('div')
		let stack = []
		let refs = Promise.reject('')

		render(class {
			componentDidCatch(err) {
				err.preventDefault()
				stack.push('error')
				return {children: 'Hello World'}
			}
			render(props, {children}) {
				if (children)
					return children

				stack.push('render')
				return refs
			}
		}, container)

		refs.catch(() => {
			nextTick(() => {
				assert.lengthOf(stack, 2)
				assert.html(container, 'Hello World')
				done()
			}, 2)
		})
	})

	it('shoud unmount when an error is thrown in getInitalState', (done) => {
		let container = document.createElement('div')
		let error = console.error
		console.error = () => {}

		render(class {
			getInitialState() {
				throw new Error('Error!')
			}
			render() {
				return h('div', 'xxx')
			}
		}, container)

		nextTick(() => {
			assert.html(container, '')
			console.error = error
			done()
		}, 2)
	})

	it('should recover from async getInitialState error', (done) => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			componentDidCatch(err) {
				stack.push(err)
				err.preventDefault()
				return {children: 'Hello World'}
			}
			getInitialState() {
				return Promise.reject({x: '!!'})
			}
			render(props, {x, children}) {
				if (children)
					return children

				stack.push(x)
				return h('h1', 'Hello World', x)
			}
		}, container)

		nextTick(() => {
			assert.html(container, 'Hello World')
			assert.lengthOf(stack, 1)
			done()
		}, 2)
	})

	it('should unmount child components from an error in getInitialState', (done) => {
		let container = document.createElement('div')
		let stack = []
		let error = console.log
		console.error = () => {}

		render(class {
			componentWillUnmount() {
				stack.push(1)
			}
			getInitialState() {
				throw new Error('Error!')
			}
			render() {
				return class {
					componentWillUnmount() {
						stack.push(1)
					}
					render() {
						return h('div', 'xxx')
					}
				}
			}
		}, container)

		nextTick(() => {
			assert.lengthOf(stack, 1)
			assert.html(container, '')
			console.error = error
			done()
		}, 2)
	})

	it('should recover from setState', (done) => {
		let container = document.createElement('div')
		let click = new Event('click')
		let refs = null

		class ErrorBoundary extends Component {
		  constructor(props) {
		    super(props);
		    this.state = { error: null, errorInfo: null };
		  }

		  componentDidCatch(error, errorInfo) {
		  	error.preventDefault()
		    this.setState({
		      error: error,
		      errorInfo: errorInfo
		    })
		  }

		  render() {
		    if (this.state.errorInfo) {
		      return (
		      	h('div',
		      		h('h2', 'Someting went wrong'),
		      		h('details', {style: {whiteSpace: 'pre-wrap'}},
		      			this.state.error && this.state.error.toString(),
		      			h('br'),
		      			this.state.errorInfo.componentStack
		      		)
		      	)
		      );
		    }
		    return this.props.children
		  }
		}

		class BuggyCounter extends Component {
		  constructor(props) {
		    super(props);
		    this.state = { counter: 0 };
		    this.handleClick = this.handleClick.bind(this);
		  }

		  handleClick() {
		    this.setState(({counter}) => ({
		      counter: counter + 1
		    }));
		  }

		  render() {
		    if (this.state.counter !== 0) {
		      throw new Error('I crashed!');
		    }
		    return h('h1', {onClick: this.handleClick, ref: (value) => refs = value}, this.state.counter)
		  }
		}

		render(h(ErrorBoundary, h(BuggyCounter)), container)
		refs.dispatchEvent(click)

		nextTick(() => {
			assert.notEqual(container, '')
			done()
		}, 2)
	})

	it('should pass errorMessage to boundary', (done) => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			componentDidCatch(err, {errorMessage}) {
				err.preventDefault()
				stack.push(typeof errorMessage === 'string')
			}
			render() {
				throw new Error('Error!')
			}
		}, container)

		nextTick(() => {
			assert.html(container, '')
			assert.include(stack, true)
			done()
		})
	})

	it('should pass errorLocation to boundary', (done) => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			componentDidCatch(err, {errorLocation}) {
				err.preventDefault()
				stack.push(errorLocation === 'render')
			}
			render() {
				throw new Error('Error!')
			}
		}, container)

		nextTick(() => {
			assert.html(container, '')
			assert.include(stack, true)
			done()
		})
	})

	it('should pass componentStack to boundary', (done) => {
		let container = document.createElement('div')
		let stack = []

		render(class {
			componentDidCatch(err, {componentStack}) {
				err.preventDefault()
				stack.push(typeof componentStack === 'string')
			}
			render() {
				throw new Error('Error!')
			}
		}, container)

		nextTick(() => {
			assert.html(container, '')
			assert.include(stack, true)
			done()
		})
	})

	it('should handle recursive errors', (done) => {
		let container = document.createElement('div')
		let stack = []
		let count = 0
		let error = console.error
		let spy = console.error = () => { count++ }

		render(class {
			componentDidCatch(err) {
				stack.push(true)
			}
			render() {
				return class {
					componentDidCatch(err, {componentStack}) {
						return {error: true}
					}
					render() {
						if (this.state.error)
							stack.push(true)

						throw new Error('Error!')
					}
				}
			}
		}, container)

		nextTick(() => {
			assert.html(container, '')
			assert.include(stack, true)
			assert.lengthOf(stack, 2)
			assert.equal(count, 2)

			console.error = error
			done()
		})
	})

	it('should handle nested componentWillUnmount errors', (done) => {
		let container = document.createElement('div')
		let stack = []
		let error = console.error

		console.error = () => {}

		class A {
			componentDidCatch(err) {
				err.preventDefault()
				this.setState({error: true})
				stack.push('componentDidCatch')
			}
			componentWillUnmount() {
				stack.push('A componentWillUnmount')
			}
			render(props) {
				return class B {
					componentWillUnmount() {
						stack.push('B componentWillUnmount')
						throw new Error('Error!')
					}
					render() {
						return class C {
							componentWillUnmount() {
								stack.push('C componentWillUnmount')
								throw new Error('Error!')
							}
							render() {
								return h('h1', 'Hello')
							}
						}
					}
				}
			}
		}

		render(A, container)
		render(null, container)

		assert.html(container, '')
		assert.deepEqual(stack, [
			'C componentWillUnmount',
			'componentDidCatch',
			'B componentWillUnmount',
			'A componentWillUnmount'
		])

		console.error = error
		done()
	})
})
