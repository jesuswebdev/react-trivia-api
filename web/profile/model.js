'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const validatePermissions = (permissions, word) => {
    if (permissions.length > 0) {
        return permissions.every(p => p.value.startsWith(word))
    }
    return true;
}

const PermissionSchema = new Schema({
    description: { type: String, required: true },
    value: { type: String, required: true },
    active: { type: Boolean, required: true }
}, { _id: false, id: false })

const PermissionsSubSchema = new Schema({
    create: { type: [PermissionSchema], default: [], validate: (value) => validatePermissions(value, 'create:') },
    read: { type: [PermissionSchema], default: [], validate: (value) => validatePermissions(value, 'read:') },
    update: { type: [PermissionSchema], default: [], validate: (value) => validatePermissions(value, 'update:') },
    delete: { type: [PermissionSchema], default: [], validate: (value) => validatePermissions(value, 'delete:') },
}, { _id: false, id: false  })

const ProfileSchema = new Schema({
    title: { type: String, required: true },
    type: { type: String, required: true },
    permissions: { type: PermissionsSubSchema, required: true}
});

module.exports = mongoose.model('Profile', ProfileSchema);
