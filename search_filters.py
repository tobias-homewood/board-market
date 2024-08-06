from geoalchemy2 import Geography
from geoalchemy2.functions import ST_DWithin, ST_MakePoint
from sqlalchemy.sql import cast
from models import Board

def apply_filters(query, form):
        # Print the form data for debugging purposes
        print(f"Form data in apply_filters: {form.data}")

        # Condition filter slider
        condition_labels = ['Poor', 'Good', 'Great', 'Excellent', 'New']
        if form.min_condition.data is None:
            form.min_condition.data = 0
        if form.max_condition.data is None:
            form.max_condition.data = 4

        min_condition = form.min_condition.data
        max_condition = form.max_condition.data
        query = query.filter(Board.condition.in_(condition_labels[min_condition:max_condition + 1]))


        # Delivery filter slider
        delivery_labels = ['Pick up only', 'Local delivery', 'National delivery', 'International delivery']
        if form.min_delivery.data is None:
            form.min_delivery.data = 0
        if form.max_delivery.data is None:
            form.max_delivery.data = 3

        min_delivery = form.min_delivery.data
        max_delivery = form.max_delivery.data
        query = query.filter(Board.delivery_options.in_(delivery_labels[min_delivery:max_delivery + 1]))
        
        # If both min_price and max_price are provided, filter the query by price
        if form.min_price.data is not None and form.max_price.data is not None:
            min_price = form.min_price.data
            max_price = form.max_price.data
            if min_price > 0:
                query = query.filter(Board.asking_price.between(min_price, max_price))
            else:
                query = query.filter(Board.asking_price <= max_price)

        # If board_manufacturer is provided, filter the query by board_manufacturer
        if form.board_manufacturer.data:
            query = query.filter(Board.board_manufacturer.ilike(f"%{form.board_manufacturer.data}%"))

        # If both min_length and max_length are provided, filter the query by length
        if form.min_length.data is not None and form.max_length.data is not None:
            min_length = form.min_length.data
            max_length = form.max_length.data
            query = query.filter(Board.board_length_total.between(min_length, max_length))

        # If sell_or_rent is provided, filter the query by sell_or_rent
        if form.sell_or_rent.data:
            query = query.filter(Board.sell_or_rent.ilike(f"%{form.sell_or_rent.data}%"))

        # If fin_setup is provided, filter the query by fin_setup
        if form.fin_setup.data:
            query = query.filter(Board.fin_setup.ilike(f"%{form.fin_setup.data}%"))

        # If board_material is provided, filter the query by board_material
        if form.board_material.data:
            query = query.filter(Board.board_material.ilike(f"%{form.board_material.data}%"))

        # If board_location_coordinates is provided, filter the query by board_location_coordinates
        if form.board_location_coordinates.data:
            # Remove square brackets and split the string into lat and lon
            lon, lat = map(float, form.board_location_coordinates.data.strip('[]').split(','))
            print(f"Form coordinates: {lon}, {lat}")  # Print the coordinates from the form
            if form.max_distance.data is not None:
                max_distance = form.max_distance.data
            else:
                max_distance = 50  # Default value if not provided

            # Create a point geometry from the coordinates
            point = ST_MakePoint(lon, lat)

            # Fetch all boards that are within max_distance of the point
            boards = Board.query.filter(
                ST_DWithin(
                    Board.board_location_spatial,
                    cast(point, Geography),
                    max_distance * 1000  # Convert kilometers to meters
                )
            ).all()

            # Convert the list of nearby boards to a list of their IDs
            nearby_board_ids = [board.board_id for board in boards]

            # Filter the query by the IDs of the nearby boards
            query = query.filter(Board.board_id.in_(nearby_board_ids))

        # If delivery_options is provided, filter the query by delivery_options
        if form.delivery_options.data:
            query = query.filter(Board.delivery_options.ilike(f"%{form.delivery_options.data}%"))

        # If model is provided, filter the query by model
        if form.model.data:
            query = query.filter(Board.model.ilike(f"%{form.model.data}%"))

        # If min_width or max_width is provided, filter the query by width
        if form.min_width.data is not None or form.max_width.data is not None:
            min_width = form.min_width.data if form.min_width.data else 0
            max_width = form.max_width.data if form.max_width.data else float('inf')  # Use a very large number if max_width is not provided
            query = query.filter(Board.width_total.between(min_width, max_width))

        # If both min_depth and max_depth are provided, filter the query by depth
        if form.min_depth.data is not None and form.max_depth.data is not None:
            min_depth = float(form.min_depth.data)
            max_depth = float(form.max_depth.data)
            if min_depth >= 0 and max_depth >= min_depth:
                query = query.filter(Board.depth_total.between(min_depth, max_depth))

        # If both min_volume and max_volume are provided, filter the query by volume
        if form.min_volume.data is not None and form.max_volume.data is not None:
            min_volume = form.min_volume.data
            max_volume = form.max_volume.data
            if min_volume >= 0 and max_volume >= min_volume:
                query = query.filter(Board.volume_litres.between(min_volume, max_volume))

        # Return the filtered query
        return query
