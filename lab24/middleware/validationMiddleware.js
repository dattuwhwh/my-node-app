import Joi from 'joi';

export const createUserSchema = Joi.object({

    name: Joi.string()
        .min(2)
        .max(100)
        .required(),

    email: Joi.string()
        .email()
        .required(),

    group_name: Joi.string()
        .pattern(/^ББМО-\d{2}-\d{2}$/)
        .required(),

    age: Joi.number()
        .integer()
        .min(16)
        .max(100)
        .required(),

    course: Joi.number()
        .integer()
        .min(1)
        .max(4)
});

export const updateUserSchema = Joi.object({

    name: Joi.string()
        .min(2)
        .max(100),

    email: Joi.string()
        .email(),

    group_name: Joi.string()
        .pattern(/^ББМО-\d{2}-\d{2}$/),

    age: Joi.number()
        .integer()
        .min(16)
        .max(100),

    course: Joi.number()
        .integer()
        .min(1)
        .max(4)

}).min(1);

export const querySchema = Joi.object({

    page: Joi.number()
        .integer()
        .min(1)
        .default(1),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10),

    group_name: Joi.string()
        .pattern(/^ББМО-\d{2}-\d{2}$/),

    course: Joi.number()
        .integer()
        .min(1)
        .max(4),

    age_min: Joi.number()
        .integer()
        .min(16)
        .max(100),

    age_max: Joi.number()
        .integer()
        .min(16)
        .max(100),

    sort: Joi.string()
        .valid(
            'name',
            '-name',
            'age',
            '-age',
            'created_at',
            '-created_at'
        )
        .default('-created_at')

});

export async function validateCreateUser(
    ctx,
    next
) {

    const { error, value } =
        createUserSchema.validate(
            ctx.request.body,
            {
                abortEarly: false,
                stripUnknown: true
            }
        );

    if (error) {

        ctx.status = 400;

        ctx.body = {
            error: 'Validation failed',

            details:
                error.details.map(item => ({
                    field:
                        item.path.join('.'),

                    message:
                        item.message
                }))
        };

        return;
    }

    ctx.request.body = value;

    await next();
}

export async function validateUpdateUser(
    ctx,
    next
) {

    const { error, value } =
        updateUserSchema.validate(
            ctx.request.body,
            {
                abortEarly: false,
                stripUnknown: true
            }
        );

    if (error) {

        ctx.status = 400;

        ctx.body = {
            error: 'Validation failed',

            details:
                error.details.map(item => ({
                    field:
                        item.path.join('.'),

                    message:
                        item.message
                }))
        };

        return;
    }

    ctx.request.body = value;

    await next();
}

export async function validateQuery(
    ctx,
    next
) {

    const { error, value } =
        querySchema.validate(
            ctx.query,
            {
                abortEarly: false,
                convert: true
            }
        );

    if (error) {

        ctx.status = 400;

        ctx.body = {
            error: 'Validation failed',

            details:
                error.details.map(item => ({
                    field:
                        item.path.join('.'),

                    message:
                        item.message
                }))
        };

        return;
    }

    ctx.state.query = value;

    await next();
}