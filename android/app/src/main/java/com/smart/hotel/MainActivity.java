package com.smart.hotel;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable full‑screen edge‑to‑edge layout
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}

