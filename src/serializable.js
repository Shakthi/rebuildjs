class Serializable {


	_serialize(data) {
		var fields = this.serialize()
		if (!fields) {
			return [];
		}

		if (!fields.length) {

			if (data === undefined) {
				data = this;
			}

			for (var prop in data) {
				fields.push(prop);
			}
		}

		return fields;

	}



	toJson() {

		function toJsonEntity(entity) {
			switch (typeof(entity)) {
				case 'number':
				case 'string':
				case 'boolean':
					return entity;


				case 'object':
					if (entity == null) {
						return entity;

					} else if (Array.isArray(entity)) {
						return entity.map(function(argument) {
							return toJsonEntity(argument);
						});

					} else if (entity) {
						const data = {
							constructorName: entity.constructor.name,
							content: entity.toJson()

						};
						return data;

					}

			}

		}

		const data = {};

		const self = this;


		this._serialize().forEach(function(argument) {
			data[argument] = toJsonEntity(self[argument]);
		})

		return data;

	}


	fromJson(data) {

		function fromJsonEntity(self, entity) {
			switch (typeof(entity)) {
				case 'number':
				case 'string':
				case 'boolean':
					return entity;


				case 'object':
					if (entity == null) {
						return entity;

					} else if (Array.isArray(entity)) {
						return entity.map(function(argument) {
							return fromJsonEntity(self, argument);
						});
					} else if (entity) {
						if (entity.constructorName) {
							const factory = self.factory();
							const outObject = Object.create(factory[entity.constructorName].prototype);
							outObject.fromJson(entity.content);

							return outObject;
						} else {

							return entity;
						}



					}

			}

		}

		const self = this;
		this._serialize(data).reverse().forEach(function(argument) {
			self[argument] = fromJsonEntity(self, data[argument]);
		})

	}


	serialize() {
		const ret = [];
		ret.add = function() {
			const args = Array.from(arguments);
			args.forEach(function(argument) {
				ret.push(argument);
			})
			return this;
		}
		return ret;
	}

	factory() {

		const ret = {};
		ret.add = function() {
			const args = Array.from(arguments);
			args.forEach(function(argument) {
				ret[argument.prototype.constructor.name] = argument;
			})
			return this;
		}
		return ret;
	}

}

module.exports = Serializable;