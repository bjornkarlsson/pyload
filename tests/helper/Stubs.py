# -*- coding: utf-8 -*-

import sys
from os.path import abspath, dirname, join
from time import strftime
from traceback import format_exc
from collections import defaultdict

sys.path.append(abspath(join(dirname(__file__), "..", "..", "pyload", "lib")))
sys.path.append(abspath(join(dirname(__file__), "..", "..")))

import __builtin__

from pyload.Api import Role
from pyload.datatypes.User import User
from pyload.datatypes.PyPackage import PyPackage
from pyload.threads.BaseThread import BaseThread
from pyload.config.ConfigParser import ConfigParser
from pyload.network.RequestFactory import RequestFactory
from pyload.PluginManager import PluginManager
from pyload.utils.JsEngine import JsEngine

from logging import log, DEBUG, INFO, WARN, ERROR


# Do nothing
def noop(*args, **kwargs):
    pass

ConfigParser.save = noop

class LogStub:
    def debug(self, *args):
        log(DEBUG, *args)

    def info(self, *args):
        log(INFO, *args)

    def error(self, *args):
        log(ERROR, *args)

    def warning(self, *args):
        log(WARN, *args)


class NoLog:
    def debug(self, *args):
        pass

    def info(self, *args):
        pass

    def error(self, *args):
        log(ERROR, *args)

    def warning(self, *args):
        log(WARN, *args)


class Core:
    def __init__(self):
        self.log = NoLog()

        self.api = self.core = self
        self.threadManager = self
        self.debug = True
        self.captcha = True
        self.config = ConfigParser()
        self.pluginManager = PluginManager(self)
        self.requestFactory = RequestFactory(self)
        __builtin__.pyreq = self.requestFactory
        self.accountManager = AccountManager()
        self.addonManager = AddonManager()
        self.eventManager = self.evm = NoopClass()
        self.interActionManager = self.im = NoopClass()
        self.js = JsEngine()
        self.cache = {}
        self.packageCache = {}

        self.statusMsg = defaultdict(lambda: "statusmsg")

        self.log = LogStub()

    def getServerVersion(self):
        return "TEST_RUNNER on %s" % strftime("%d %h %Y")

    def path(self, path):
        return path

    def updateLink(self, *args):
        pass

    def updatePackage(self, *args):
        pass

    def processingIds(self, *args):
        return []

    def getPackage(self, id):
        return PyPackage(self, 0, "tmp", "tmp", "", "", 0, 0)

    def print_exc(self):
        log(ERROR, format_exc())


class NoopClass:
    def __getattr__(self, item):
        return noop


class AddonManager(NoopClass):
    def activePlugins(self):
        return []


class AccountManager:
    def getAccountForPlugin(self, name):
        return None


class Thread(BaseThread):
    def __init__(self, core):
        BaseThread.__init__(self, core)
        self.plugin = None


    def writeDebugReport(self):
        if hasattr(self, "pyfile"):
            dump = BaseThread.writeDebugReport(self, self.plugin.__name__, pyfile=self.pyfile)
        else:
            dump = BaseThread.writeDebugReport(self, self.plugin.__name__, plugin=self.plugin)

        return dump

__builtin__._ = lambda x: x
__builtin__.pypath = abspath(join(dirname(__file__), "..", ".."))
__builtin__.addonManager = AddonManager()
__builtin__.pyreq = None

adminUser = User(None, uid=0, role=Role.Admin)
normalUser = User(None, uid=1, role=Role.User)