package site.smarttaxsolution.app;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.content.Intent;
import android.net.Uri;
import android.view.Gravity;
import android.view.View;
import android.widget.*;

public class MainActivity extends Activity {
    private final int navy = Color.rgb(17, 38, 75);
    private final int blue = Color.rgb(32, 93, 180);
    private final int pale = Color.rgb(241, 245, 251);
    private LinearLayout root, body, nav;
    private String current = "Home";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(navy);
        getWindow().setNavigationBarColor(Color.WHITE);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(pale);
        setContentView(root);
        body = new LinearLayout(this); body.setOrientation(LinearLayout.VERTICAL);
        ScrollView scroll = new ScrollView(this); scroll.setFillViewport(true); scroll.addView(body);
        root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));
        nav = new LinearLayout(this); nav.setBackgroundColor(Color.WHITE); nav.setElevation(dp(10)); root.addView(nav, new LinearLayout.LayoutParams(-1, dp(64)));
        show("Home");
    }

    private int dp(float v) { return (int)(v * getResources().getDisplayMetrics().density + .5f); }
    private GradientDrawable bg(int color, int radius) {
        GradientDrawable d = new GradientDrawable(); d.setColor(color); d.setCornerRadius(dp(radius)); return d;
    }
    private TextView text(String s, int size, int color, boolean bold) {
        TextView t = new TextView(this); t.setText(s); t.setTextSize(size); t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT, Typeface.BOLD); return t;
    }
    private LinearLayout column() { LinearLayout l=new LinearLayout(this); l.setOrientation(LinearLayout.VERTICAL); return l; }
    private void pad(View v, int p) { v.setPadding(dp(p),dp(p),dp(p),dp(p)); }
    private void show(String tab) {
        current=tab; body.removeAllViews(); nav.removeAllViews();
        if(tab.equals("Home")) home(); else if(tab.equals("Services")) services();
        else if(tab.equals("Notifications")) notifications(); else profile();
        String[] labels={"Home","Services","Notifications","Profile"};
        String[] icons={"⌂","▦","♧","●"};
        for(int i=0;i<labels.length;i++){
            final String name=labels[i]; LinearLayout item=column(); item.setGravity(Gravity.CENTER);
            TextView ic=text(icons[i],21,name.equals(tab)?blue:Color.GRAY,true); ic.setGravity(Gravity.CENTER);
            TextView tx=text(name,10,name.equals(tab)?blue:Color.GRAY,name.equals(tab)); tx.setGravity(Gravity.CENTER);
            item.addView(ic); item.addView(tx); item.setOnClickListener(v->show(name));
            nav.addView(item,new LinearLayout.LayoutParams(0,-1,1));
        }
    }
    private void heading(String title, String sub) {
        LinearLayout h=column(); pad(h,20); h.setBackgroundColor(navy);
        h.addView(text("SMART TAX SOLUTION",12,Color.rgb(184,207,244),true));
        TextView t=text(title,25,Color.WHITE,true); t.setPadding(0,dp(9),0,dp(4)); h.addView(t);
        h.addView(text(sub,13,Color.rgb(222,231,246),false)); body.addView(h);
    }
    private void section(String s) { TextView t=text(s,18,navy,true); t.setPadding(dp(18),dp(18),dp(18),dp(8)); body.addView(t); }
    private void card(String icon,String title,String desc,Runnable action) {
        LinearLayout c=new LinearLayout(this); c.setOrientation(LinearLayout.HORIZONTAL); c.setGravity(Gravity.CENTER_VERTICAL);
        c.setBackground(bg(Color.WHITE,16)); c.setElevation(dp(2)); pad(c,15);
        TextView i=text(icon,25,blue,true); i.setGravity(Gravity.CENTER); i.setBackground(bg(0xFFEAF1FC,12));
        c.addView(i,new LinearLayout.LayoutParams(dp(48),dp(48)));
        LinearLayout words=column(); words.setPadding(dp(12),0,0,0);
        words.addView(text(title,15,navy,true)); TextView d=text(desc,12,Color.DKGRAY,false); d.setPadding(0,dp(4),0,0); words.addView(d);
        c.addView(words,new LinearLayout.LayoutParams(0,-2,1));
        c.setOnClickListener(v->action.run());
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2); lp.setMargins(dp(16),dp(5),dp(16),dp(9)); body.addView(c,lp);
    }
    private void home() {
        heading("Your Tax, Simplified","Welcome to your digital tax assistance hub");
        LinearLayout banner=column(); banner.setBackground(bg(blue,18)); pad(banner,18);
        banner.addView(text("SMART TAX • DIGITAL SERVICES",11,0xFFDCE9FF,true));
        TextView title=text("Manage your tax needs with confidence",20,Color.WHITE,true); title.setPadding(0,dp(8),0,dp(7)); banner.addView(title);
        banner.addView(text("Explore services, learning resources and support — all in one app.",13,Color.WHITE,false));
        LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(-1,-2); bp.setMargins(dp(16),dp(16),dp(16),dp(4)); body.addView(banner,bp);
        section("Quick services");
        card("GST","GST Services","Registration, returns and compliance",()->show("Services"));
        card("₹","Income Tax","ITR assistance and tax information",()->info("Income Tax","Income Tax assistance and filing support. Contact Smart Tax for service details."));
        card("▣","Accounting","Bookkeeping and accounting software support",()->info("Accounting","Accounting and software support including Tally and Busy."));
        section("Learning & support");
        card("▤","Courses & Exams","Learning, online exams and certificates",()->info("Courses & Exams","Course and exam access will be connected to the dedicated student system."));
        card("☎","WhatsApp Support","Connect with our support team",()->open("https://wa.me/919664029638"));
    }
    private void services() {
        heading("Our Services","Choose a service to explore");
        section("Tax & compliance");
        card("GST","GST Registration","Registration and related assistance",()->info("GST Registration","Get assistance with GST registration and documentation."));
        card("↻","GST Returns","GSTR-1, GSTR-3B and return compliance",()->info("GST Returns","Return preparation and compliance assistance."));
        card("₹","Income Tax","ITR filing and income tax support",()->info("Income Tax","Income tax return and related assistance."));
        card("▦","Accounting","Tally, Busy and accounting support",()->info("Accounting","Accounting setup, bookkeeping and software support."));
        section("Government portals");
        card("↗","GST Portal","Open the official GST portal",()->open("https://www.gst.gov.in/"));
        card("↗","Income Tax Portal","Open the official Income Tax portal",()->open("https://www.incometax.gov.in/"));
        card("↗","Udyam Registration","Open the official MSME portal",()->open("https://udyamregistration.gov.in/"));
        card("☎","Contact Smart Tax","WhatsApp support",()->open("https://wa.me/919664029638"));
    }
    private void notifications() {
        heading("Notifications","Updates and important information");
        section("Recent updates");
        card("•","Welcome to Smart Tax","Your app dashboard is ready to use.",()->info("Welcome","Thank you for using Smart Tax Solution."));
        card("!","Stay connected","Contact support for service and course updates.",()->open("https://wa.me/919664029638"));
        TextView note=text("New application, payment and course alerts will appear here when notification services are connected.",13,Color.DKGRAY,false);
        pad(note,18); body.addView(note);
    }
    private void profile() {
        heading("My Profile","Your account and support");
        LinearLayout p=column(); p.setBackground(bg(Color.WHITE,18)); pad(p,18);
        p.addView(text("Smart Tax Solution User",18,navy,true));
        p.addView(text("Sign-in and personal account features will be enabled with the app's dedicated account service.",13,Color.DKGRAY,false));
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2); lp.setMargins(dp(16),dp(18),dp(16),dp(8)); body.addView(p,lp);
        section("Account & help");
        card("✉","Contact Support","Email: smarttaxsolutionsgnr@gmail.com",()->open("mailto:smarttaxsolutionsgnr@gmail.com"));
        card("☎","WhatsApp","96640 29638",()->open("https://wa.me/919664029638"));
        card("ⓘ","About Smart Tax","Tax, GST and accounting assistance",()->info("About Smart Tax Solution","Smart Tax Solution\nSri Ganganagar, Rajasthan\nWhatsApp: 96640 29638"));
    }
    private void info(String title,String message) {
        new android.app.AlertDialog.Builder(this).setTitle(title).setMessage(message).setPositiveButton("OK",null).show();
    }
    private void open(String url) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); }
        catch(Exception e) { info("Unable to open","No compatible app found on this device."); }
    }
    @Override public void onBackPressed() {
        if(!current.equals("Home")) show("Home"); else super.onBackPressed();
    }
}
