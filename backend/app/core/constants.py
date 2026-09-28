from enum import Enum

class FeederStatus(str, Enum):
    NORMAL = "NORMAL"
    HIGH_LOADING = "HIGH_LOADING"
    OVERLOADED = "OVERLOADED"
    OFFLINE = "OFFLINE"
    MAINTENANCE = "MAINTENANCE"

class SeverityLevel(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class ActionType(str, Enum):
    REDUCE = "REDUCE"
    SHIFT = "SHIFT"
    KEEP_ON = "KEEP_ON"
    RESTORE = "RESTORE"

class ConsumerType(str, Enum):
    RESIDENTIAL = "Residential"
    AGRICULTURE = "Agriculture"
    COMMERCIAL = "Commercial"
    INDUSTRIAL = "Industrial"
    HOSPITAL = "Hospital"
    WATER_SUPPLY = "Water Supply"
    TELECOM = "Telecom"

# Priority weights for MILP optimization objective function
# Priority 1: Critical (Hospitals/Water) - heavily penalized to prevent reductions
PRIORITY_WEIGHTS = {
    1: 10000.0,
    2: 5000.0,
    3: 1000.0,
    4: 200.0,
    5: 50.0,
}

# Thermal loading threshold percentages
HIGH_LOADING_THRESHOLD = 0.85
OVERLOAD_THRESHOLD = 1.00
EXCESSIVE_OUTAGE_HOURS_THRESHOLD = 2.0
