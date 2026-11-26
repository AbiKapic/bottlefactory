# Water filling, capping and packing simulation

Reload the updated TwinCAT source, build, and apply it to the local simulation. Clear MAIN.bCinnamonRun before applying the change, put the PLC in RUN, then set the request to TRUE for the demo.

1. The water level climbs from 0 to 100 percent during the eight-second fill. The PLC derives it from the filling timer's elapsed time.
2. The conveyor moves the filled bottle half a pitch to the capper. The Cinnamon capping cycle places the cap and retracts.
3. The arm grips and lifts the capped bottle, then lowers it into the box on the left. The PLC publishes placement progress for that stroke.
4. The conveyor travels the remaining half pitch to bring the next bottle to the filler. A complete cycle moves the conveyor position by 100 units.

Use the dashboard at http://localhost:5173/. If water level or transfer motion is missing, check the API payload for fillPercent, transferPhase, and placeProgress. Null values indicate the running PLC has not exposed those signals.
