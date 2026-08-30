"""FX rates via Frankfurter — free, no API key, ECB-backed daily rates."""

from __future__ import annotations

import logging
import time

import httpx

logger = logging.getLogger(__name__)

_CACHE_TTL_SECONDS = 3600
_cache: dict[str, tuple[float, float]] = {}


def get_rate(from_currency: str, to_currency: str) -> float:
    """Return how many units of `to_currency` equal one unit of `from_currency`."""
    from_code = from_currency.lower()
    to_code = to_currency.lower()
    if from_code == to_code:
        return 1.0

    key = f"{from_code}:{to_code}"
    now = time.time()
    cached = _cache.get(key)
    if cached and cached[1] > now:
        return cached[0]

    url = f"https://api.frankfurter.app/latest?from={from_code.upper()}&to={to_code.upper()}"
    response = httpx.get(url, timeout=10.0)
    response.raise_for_status()
    data = response.json()
    rate = float(data["rates"][to_code.upper()])
    _cache[key] = (rate, now + _CACHE_TTL_SECONDS)
    return rate


def convert_minor_units(amount_minor: int, from_currency: str, to_currency: str) -> int:
    """Convert an amount in minor units (cents/pence) between currencies."""
    rate = get_rate(from_currency, to_currency)
    return round(amount_minor * rate)
