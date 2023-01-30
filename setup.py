# -*- coding: utf-8 -*-

"""The Datakortet Javascript package, dk.js.
"""

import setuptools

classifiers = """\
Development Status :: 3 - Alpha
Intended Audience :: Developers
Programming Language :: Python
Programming Language :: Javascript
Topic :: Software Development :: Libraries
"""

version = '3.0.73'

setuptools.setup(
    name='dkdj',
    version=version,
    packages=setuptools.find_packages(exclude=['tests']),
    install_requires=[
        'ttcal',
        'dkjason>=3.0.6',
        'six',
        'future',
        'bleach',
    ],
    url='https://github.com/thebjorn/dkdj',
    classifiers=[line for line in classifiers.split('\n') if line],
    long_description=open('README.rst').read(),
    license='MIT',
    author='Bjorn Pettersen',
    author_email='bp@norsktest.no',
    description=''
)

