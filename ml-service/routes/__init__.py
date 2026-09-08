def register_routes(app):
    from routes.pricing import bp as pricing_bp

    app.register_blueprint(pricing_bp)
