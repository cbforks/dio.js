/**
 * Component
 *
 * @param {Object?} _props
 */
function Component (_props) {
	var props = _props;
	var state = this.state;
	// props
	if (this.props === void 0) {
		this.props = props !== null && props !== void 0 ? props : (props = {});
	}
	// state
	if (state === void 0) {
		state = this.state = {};
	}
	this.refs = null;
	this._tree = null;
	this._block = 1;
	this._state = state;
}

/**
 * Component Prototype
 *
 * @type {Object}
 */
var prototype = {
	setState: {value: setState},
	forceUpdate: {value: forceUpdate},
	UUID: {value: 7}
};
Component.prototype = Object.create(null, prototype);
prototype.UUID.value = 0;

/**
 * Extend Class
 *
 * @param  {Class} type
 * @param  {Object} proto
 */
function extendClass (type, proto) {
	if (proto.constructor !== type) {
		Object.defineProperty(proto, 'constructor', {value: type});
	}
	Object.defineProperties(proto, prototype);
}

/**
 * setState
 *
 * @param {Object} state
 * @param {Function=} callback
 */
function setState (state, callback) {
	var nextState;
	var prevState;
	var owner;

	if (state === void 0) {
		return;
	}

	nextState = state;
	prevState = this._state = this.state;

	if (typeof nextState === 'function') {
		if ((nextState = callbackBoundary(this, nextState, prevState, 0)) === void 0) {
			return;
		}
	}

	if (state !== null && state.constructor === Promise) {
		owner = this;
		state.then(function (value) {
			owner.setState(value);
		});
	} else {
		this.state = updateState({}, prevState, nextState);
		this.forceUpdate(callback);
	}
}

/**
 * forceUpdate
 *
 * @param {Function=} callback
 */
function forceUpdate (callback) {
	var tree = this._tree;

	if (this._block !== 0 || tree.node === null) {
		return;
	}

	patch(tree, tree, 1, tree);

	if (callback !== void 0 && typeof callback === 'function') {
		callbackBoundary(this, callback, this.state, 1);
	}
}

/**
 * Update State
 *
 * @param  {Object} state
 * @param  {Object} prevState
 * @param  {Object} nextState
 * @return {Object}
 */
function updateState (state, prevState, nextState) {
	for (var name in prevState) {
		state[name] = prevState[name];
	}
	for (var name in nextState) {
		state[name] = nextState[name];
	}

	return state;
}

/**
 * shouldUpdate
 *
 * @param  {Tree} older
 * @param  {Tree} newer
 * @param  {Number} cast
 * @return {Tree?}
 */
function shouldUpdate (older, newer, cast) {
	var type = older.type;
	var owner = older.owner;
	var nextProps = newer.props;
	var prevProps = older.props;

	var recievedProps;
	var defaultProps;
	var prevState;
	var nextState;
	var nextProps;
	var prevProps;
	var branch;
	var tree;
	var tag;

	if (owner === null) {
		return null;
	}

	if (cast === 1) {
		if (owner._block !== 0) {
			return null;
		}
		nextState = owner.state;
		prevState = owner._state;
		owner._block = 1;
	} else {
		nextState = nextProps === null ? object : nextProps;
		prevState = prevProps === null ? object : prevProps;
	}

	if ((recievedProps = nextProps !== null) === true) {
		if (type.propTypes !== void 0) {
			propTypes(type, nextProps);
		}

		if (owner.componentWillReceiveProps !== void 0) {
			dataBoundary(owner, 0, nextProps);
		}

		defaultProps = older.type.defaultProps;

		if (defaultProps !== void 0) {
			merge(defaultProps, nextProps);
		}
	}

	if (
		owner.shouldComponentUpdate !== void 0 &&
		updateBoundary(owner, 0, nextProps, nextState) === false
	) {
		return (owner._block = 0, null);
	}

	if (recievedProps === true) {
		(cast === 1 ? owner : older).props = nextProps;
	}

	if (owner.componentWillUpdate !== void 0) {
		updateBoundary(owner, 1, nextProps, nextState);
	}

	tree = shape(renderBoundary(cast === 1 ? owner : older, cast), owner);
	tag = tree.tag;

	if (tag !== older.tag) {
		if (tag === null) {
			if ((branch = older.branch) !== null && branch instanceof tree.type) {
				patch(branch._tree, tree, tree.cast);
			} else {
				swap(older, tree, 2, older);
				refresh(older);
			}
		} else {
			swap(older, tree, 2, older);
		}
		tree = null;
	}

	if (owner.componentDidUpdate !== void 0) {
		updateBoundary(owner, 2, prevProps, prevState);
	}

	if (cast === 1) {
		if (owner._block === 2) {
			tree = null;
		} else {
			owner._block = 0;
		}
	}

	return tree;
}

/**
 * PropTypes
 *
 * @param {Function|Class} type
 * @param {Object} props
 */
function propTypes (type, props) {
	var validators = type.propTypes;
	var display = type.name;
	var result;

	for (var name in validators) {
		if (result = validators[name](props, name, display)) {
			console.error(result);
		}
	}
}
